import React, { useState, useEffect, useCallback } from 'react';
import { FormInput, FormTextArea } from './FormControls';
import * as firestoreService from '../services/firestoreService';
import { firebaseAuth } from '../services/authService';
import { logAnalyticsEvent } from '../services/analyticsService';

interface ReportBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  appVersion: string;
}

const BUG_REPORT_RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const LOCAL_STORAGE_KEY_LAST_BUG_REPORT = 'lastBugReportTimestamp';

export const ReportBugModal: React.FC<ReportBugModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  appVersion,
}) => {
  const [contactInfo, setContactInfo] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitEndsAt, setRateLimitEndsAt] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState('');

  const calculateRemainingTime = useCallback((endsAt: number | null) => {
    if (endsAt === null) return '';
    const now = Date.now();
    const diff = endsAt - now;
    if (diff <= 0) return '';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes} minute(s) and ${seconds} second(s)`;
  }, []);

  const checkRateLimit = useCallback(() => {
    const storedTimestamp = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_BUG_REPORT);
    if (storedTimestamp) {
      const lastReportTime = parseInt(storedTimestamp, 10);
      const now = Date.now();
      const timeSinceLastReport = now - lastReportTime;

      if (timeSinceLastReport < BUG_REPORT_RATE_LIMIT_MS) {
        setIsRateLimited(true);
        const endsAt = lastReportTime + BUG_REPORT_RATE_LIMIT_MS;
        setRateLimitEndsAt(endsAt);
        setRemainingTime(calculateRemainingTime(endsAt));
        return true; // Is currently rate-limited
      }
    }
    setIsRateLimited(false);
    setRateLimitEndsAt(null);
    setRemainingTime('');
    return false; // Not rate-limited
  }, [calculateRemainingTime]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isOpen) {
      setContactInfo(currentUserEmail || '');
      setBugDescription('');
      setStepsToReproduce('');
      setExpectedBehavior('');
      setActualBehavior('');
      setSubmissionStatus('idle');
      setSubmissionMessage(null);

      const limited = checkRateLimit();
      if (limited && rateLimitEndsAt) {
        intervalId = setInterval(() => {
          const newRemaining = calculateRemainingTime(rateLimitEndsAt);
          if (newRemaining === '') {
            checkRateLimit(); // Re-check to unlock form
            if (intervalId) clearInterval(intervalId);
          } else {
            setRemainingTime(newRemaining);
          }
        }, 1000);
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, currentUserEmail, checkRateLimit, calculateRemainingTime, rateLimitEndsAt]);

  const handleSubmit = async () => {
    if (isRateLimited) {
      setSubmissionStatus('error');
      setSubmissionMessage(`Please wait ${remainingTime} before submitting another report.`);
      return;
    }
    if (!bugDescription.trim()) {
      setSubmissionStatus('error');
      setSubmissionMessage('Please provide a description of the bug.');
      return;
    }
    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setSubmissionMessage(null);

    const user = firebaseAuth?.currentUser;

    const baseReportData = {
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'anonymous',
      appVersion: appVersion,
      bugDescription: bugDescription.trim(),
      userAgent: navigator.userAgent,
    };

    const optionalData: Partial<firestoreService.BugReportData> = {};
    const trimmedSteps = stepsToReproduce.trim();
    if (trimmedSteps) optionalData.stepsToReproduce = trimmedSteps;

    const trimmedExpected = expectedBehavior.trim();
    if (trimmedExpected) optionalData.expectedBehavior = trimmedExpected;

    const trimmedActual = actualBehavior.trim();
    if (trimmedActual) optionalData.actualBehavior = trimmedActual;

    const trimmedContact = contactInfo.trim();
    if (trimmedContact) optionalData.contactInfo = trimmedContact;

    const reportDataToSend: firestoreService.BugReportData = {
      ...baseReportData,
      ...optionalData,
    };

    try {
      await firestoreService.submitBugReport(reportDataToSend);
      setSubmissionStatus('success');
      setSubmissionMessage('Bug report submitted successfully! Thank you.');
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_BUG_REPORT, Date.now().toString());
      checkRateLimit(); // Re-apply rate limit immediately
      logAnalyticsEvent('report_bug_submitted', {
        app_version: appVersion,
        submission_method: 'firestore',
      });

      setTimeout(() => {
        if (isOpen && submissionStatus === 'success') onClose();
      }, 3000);
    } catch (e) {
      console.error('Error submitting bug report:', e);
      setSubmissionStatus('error');
      setSubmissionMessage(
        e instanceof Error ? e.message : 'Failed to submit bug report. Please try again.'
      );
      logAnalyticsEvent('report_bug_submission_failed', {
        app_version: appVersion,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formDisabled = isSubmitting || isRateLimited || submissionStatus === 'success';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm font-rajdhani modal-backdrop"
      onClick={formDisabled ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-bug-title"
    >
      <div
        className="modal-card p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-content"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 id="report-bug-title" className="text-2xl font-bold modal-title">
            Report a Bug
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl transition-colors"
            aria-label="Close bug report form"
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {submissionStatus === 'idle' && !isRateLimited && (
            <p className="text-sm text-[var(--clr-text-muted)]">
              Thank you for helping improve the Dokkan Patch Maker! Please provide as much detail as
              possible. Your report will be submitted directly.
            </p>
          )}

          {isRateLimited && (
            <div className="p-3 bg-[var(--clr-warning)]/20 border border-[var(--clr-warning)] rounded-md text-[var(--clr-warning)] text-sm">
              <i className="fas fa-hourglass-half mr-2"></i>
              You have recently submitted a bug report. Please wait {remainingTime} before
              submitting another.
            </div>
          )}

          {submissionStatus === 'success' && (
            <div className="p-3 bg-[var(--clr-success)]/20 border border-[var(--clr-success)] rounded-md text-center">
              <i className="fas fa-check-circle text-[var(--clr-success)] text-3xl mb-2"></i>
              <p className="text-[var(--clr-success)] font-semibold">{submissionMessage}</p>
              {!isRateLimited && (
                <p className="text-xs text-[var(--clr-text-muted)] mt-1">
                  This window will close automatically.
                </p>
              )}
            </div>
          )}

          {submissionStatus === 'error' && submissionMessage && !isRateLimited && (
            <div className="p-3 bg-[var(--clr-danger)]/20 border border-[var(--clr-danger)] rounded-md text-[var(--clr-danger)] text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {submissionMessage}
            </div>
          )}

          {(submissionStatus !== 'success' || isRateLimited) && (
            <>
              <FormTextArea
                label="Bug Description (Required)"
                value={bugDescription}
                onChange={setBugDescription}
                rows={4}
                placeholder="Describe the issue you encountered..."
                disabled={formDisabled}
              />
              <FormTextArea
                label="Steps to Reproduce (Optional)"
                value={stepsToReproduce}
                onChange={setStepsToReproduce}
                rows={3}
                placeholder="List the steps to make the bug appear..."
                disabled={formDisabled}
              />
              <FormTextArea
                label="Expected Behavior (Optional)"
                value={expectedBehavior}
                onChange={setExpectedBehavior}
                rows={2}
                placeholder="What did you expect to happen?"
                disabled={formDisabled}
              />
              <FormTextArea
                label="Actual Behavior (Optional)"
                value={actualBehavior}
                onChange={setActualBehavior}
                rows={2}
                placeholder="What actually happened?"
                disabled={formDisabled}
              />
              <FormInput
                label="Your Contact Email (Optional)"
                type="email"
                value={contactInfo}
                onChange={setContactInfo}
                placeholder="your.email@example.com"
                disabled={formDisabled}
                helpText="Pre-filled if logged in. Used if we need to follow up."
              />
            </>
          )}
        </div>

        {(submissionStatus !== 'success' || isRateLimited) && ( // Show buttons unless successful and not rate-limited
          <div className="mt-6 pt-4 border-t border-[var(--clr-border)] flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary py-2 px-5 rounded-md disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={formDisabled || !bugDescription.trim()}
              className="btn-primary py-2 px-5 text-sm flex items-center justify-center disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>Submit Report
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
