import React, { useState, useCallback } from 'react';
import { DokkanPatchState } from '../types';
import { FormTextArea } from './FormControls';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../context/ToastContext';

interface SqlConverterProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
}

const convertSqlLogic = (oldSql: string): string => {
  let newSql = oldSql;
  const tablesToProcess = ['passive_skill_sets', 'passive_skills'];
  // Regex for a single SQL value (string, NULL, number). Case-insensitive NULL.
  const singleValuePattern = /('[^']*(?:''[^']*)*'|NULL|[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/i
    .source;

  tablesToProcess.forEach((tableName) => {
    // MODIFIED: Made the values capturing group (.*) non-greedy (.*?)
    const statementRegex = new RegExp(
      `INSERT OR REPLACE INTO (?:(?:"main"|"MAIN")\\.)?(?:(?:"${tableName}")|${tableName}) \\(([^)]+)\\) VALUES \\((.*?)\\);`,
      'gis'
    );

    newSql = newSql.replace(statementRegex, (match, colsStr, valsStrUntrimmed) => {
      const valsStr = valsStrUntrimmed.trim();
      const originalColumns = colsStr.split(',').map((c: string) => c.trim());

      let descIndex = -1;
      for (let i = 0; i < originalColumns.length; i++) {
        const colName = originalColumns[i];
        const comparableColName = colName.replace(/^"|"$/g, '').toLowerCase();
        if (comparableColName === 'description') {
          descIndex = i;
          break;
        }
      }

      if (descIndex === -1) {
        return match;
      }

      const newColumnsList = originalColumns.filter((_, i) => i !== descIndex);

      // Specialized logic for passive_skill_sets
      if (tableName === 'passive_skill_sets') {
        const itemizedDescColIndex = originalColumns.findIndex(
          (col) => col.replace(/^"|"$/g, '').toLowerCase() === 'itemized_description'
        );
        const createdAtColIndex = originalColumns.findIndex(
          (col) => col.replace(/^"|"$/g, '').toLowerCase() === 'created_at'
        );
        const updatedAtColIndex = originalColumns.findIndex(
          (col) => col.replace(/^"|"$/g, '').toLowerCase() === 'updated_at'
        );

        // Check if the column structure matches the expected order for this specialized logic
        if (
          itemizedDescColIndex !== -1 &&
          createdAtColIndex !== -1 &&
          updatedAtColIndex !== -1 &&
          descIndex < itemizedDescColIndex &&
          originalColumns[descIndex + 1]?.replace(/^"|"$/g, '').toLowerCase() ===
            'itemized_description' &&
          originalColumns[itemizedDescColIndex + 1]?.replace(/^"|"$/g, '').toLowerCase() ===
            'created_at' &&
          originalColumns[createdAtColIndex + 1]?.replace(/^"|"$/g, '').toLowerCase() ===
            'updated_at'
        ) {
          let currentValsRemainder = valsStr;
          const headValues = [];

          // 1. Parse values BEFORE 'description'
          for (let i = 0; i < descIndex; i++) {
            const singleValueRegex = new RegExp(`^\\s*${singleValuePattern}`, 'i');
            const valMatch = currentValsRemainder.match(singleValueRegex);
            if (!valMatch) {
              console.warn(
                `SQL Converter (passive_skill_sets special): Failed to parse head value for column ${originalColumns[i]}. Remainder: ${currentValsRemainder.substring(0, 100)}`
              );
              return match; // Fallback
            }
            headValues.push(valMatch[0].trim());
            currentValsRemainder = currentValsRemainder.substring(valMatch[0].length).trim();
            if (currentValsRemainder.startsWith(',')) {
              currentValsRemainder = currentValsRemainder.substring(1).trim();
            } else if (i < originalColumns.length - 2) {
              // If not the second to last column, expect a comma
              console.warn(
                `SQL Converter (passive_skill_sets special): Missing comma after head value for ${originalColumns[i]}.`
              );
              return match; // Fallback
            }
          }

          // 2. Parse and DISCARD 'description's value
          const descValueRegex = new RegExp(`^\\s*${singleValuePattern}`, 'i');
          const descValMatch = currentValsRemainder.match(descValueRegex);
          if (!descValMatch) {
            console.warn(
              `SQL Converter (passive_skill_sets special): Failed to parse description value. Remainder: ${currentValsRemainder.substring(0, 100)}`
            );
            return match; // Fallback
          }
          currentValsRemainder = currentValsRemainder.substring(descValMatch[0].length).trim();
          if (currentValsRemainder.startsWith(',')) {
            currentValsRemainder = currentValsRemainder.substring(1).trim();
          }
          // `currentValsRemainder` now starts with `itemized_description`'s value string

          // 3. Parse `created_at` and `updated_at` from the END of `currentValsRemainder`
          const tailPattern = new RegExp(
            `(,\\s*${singleValuePattern}\\s*,\\s*${singleValuePattern}\\s*)$`,
            'i'
          );
          const tailFullMatch = currentValsRemainder.match(tailPattern);

          if (!tailFullMatch) {
            console.warn(
              `SQL Converter (passive_skill_sets special): Could not parse tail values (created_at, updated_at) from: ${currentValsRemainder.slice(-100)}`
            );
            return match; // Fallback
          }

          // Extract created_at and updated_at from the tail match
          // Need to re-match on the captured group to split created_at and updated_at
          const tailValuesStr = tailFullMatch[1].trim().replace(/^,/, '').trim(); // Remove leading comma from the group
          const tailSplitRegex = new RegExp(
            `^\\s*(${singleValuePattern})\\s*,\\s*(${singleValuePattern})\\s*$`,
            'i'
          );
          const individualTailValuesMatch = tailValuesStr.match(tailSplitRegex);

          if (!individualTailValuesMatch) {
            console.warn(
              `SQL Converter (passive_skill_sets special): Could not split captured tail values: ${tailValuesStr}`
            );
            return match; // Fallback
          }

          const valCreatedAt = individualTailValuesMatch[1].trim();
          const valUpdatedAt = individualTailValuesMatch[2].trim();

          // 4. The `itemized_description` value is everything up to where the tail match began
          const itemizedDescValue = currentValsRemainder
            .substring(0, tailFullMatch.index + tailFullMatch[0].length - tailFullMatch[1].length)
            .trim();

          const finalValues = [...headValues];
          if (itemizedDescValue) finalValues.push(itemizedDescValue); // Add if not empty
          if (valCreatedAt) finalValues.push(valCreatedAt);
          if (valUpdatedAt) finalValues.push(valUpdatedAt);

          // Filter out empty strings that might result from parsing optional/null fields if itemizedDescValue was empty
          const nonEmptyFinalValues = finalValues.filter((v) => v !== '');

          if (nonEmptyFinalValues.length !== newColumnsList.length) {
            console.warn(
              `SQL Converter (passive_skill_sets special): Final value/column count mismatch. Values: ${nonEmptyFinalValues.length} (${nonEmptyFinalValues.join('|')}), Columns: ${newColumnsList.length}. Original Vals: ${valsStr.substring(0, 100)}`
            );
            return match; // Fallback
          }

          logAnalyticsEvent('sql_converter_row_processed', {
            table_name: tableName,
            method: 'passive_set_advanced_logic',
          });
          return `INSERT OR REPLACE INTO "main"."${tableName}" (${newColumnsList.join(', ')}) VALUES (${nonEmptyFinalValues.join(', ')});`;
        }
      }

      // General logic for other tables (including passive_skills) or if passive_skill_sets special logic fails/doesn't apply
      const parsedValues = [];
      let remainingValsStr = valsStr;
      for (let i = 0; i < originalColumns.length; i++) {
        const currentColumnName = originalColumns[i];
        const singleValueRegex = new RegExp(`^\\s*${singleValuePattern}`, 'i');
        const valMatch = remainingValsStr.match(singleValueRegex);

        if (!valMatch) {
          console.warn(
            `SQL Converter (General Logic - ${tableName}, col: ${currentColumnName}): Failed to parse value. Remainder: '${remainingValsStr.substring(0, Math.min(100, remainingValsStr.length))}'`
          );
          return match;
        }

        parsedValues.push(valMatch[0].trim());
        remainingValsStr = remainingValsStr.substring(valMatch[0].length).trim();

        if (i < originalColumns.length - 1) {
          // If not the last value, expect a comma
          if (remainingValsStr.startsWith(',')) {
            remainingValsStr = remainingValsStr.substring(1).trim();
          } else {
            if (remainingValsStr.length === 0) {
              console.warn(
                `SQL Converter (General Logic - ${tableName}, col: ${currentColumnName}): Ran out of values string after parsing value, but expected more values.`
              );
            } else {
              console.warn(
                `SQL Converter (General Logic - ${tableName}, col: ${currentColumnName}): Missing comma after value. Next chars: '${remainingValsStr.substring(0, Math.min(10, remainingValsStr.length))}'`
              );
            }
            return match;
          }
        }
      }
      if (remainingValsStr.length > 0) {
        console.warn(
          `SQL Converter (General Logic - ${tableName}): Extra data found at the end of values string: '${remainingValsStr.substring(0, Math.min(100, remainingValsStr.length))}'`
        );
        return match;
      }

      // If we've reached here, parsing was successful and parsedValues.length === originalColumns.length
      const values = parsedValues;

      const newValuesList = [...values];
      newValuesList.splice(descIndex, 1);

      if (newColumnsList.length === 0 && newValuesList.length === 0) {
        // If all columns were removed (e.g. table with only 'description')
        return ``; // Return empty string to effectively remove the statement
      }
      if (newColumnsList.length !== newValuesList.length) {
        console.warn(
          `SQL Converter (General Logic - ${tableName}): Column and value count mismatch after splicing. New Cols: ${newColumnsList.length}, New Vals: ${newValuesList.length}. This should not happen.`
        );
        return match; // Fallback if counts don't align after splice (highly unlikely if descIndex is valid)
      }

      logAnalyticsEvent('sql_converter_row_processed', {
        table_name: tableName,
        method: 'general_logic_revised',
      });
      return `INSERT OR REPLACE INTO "main"."${tableName}" (${newColumnsList.join(', ')}) VALUES (${newValuesList.join(', ')});`;
    });
  });

  return newSql;
};

export const SqlConverter: React.FC<SqlConverterProps> = ({ patchState, setPatchState }) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleInputChange = (value: string) => {
    setPatchState((prev) => ({
      ...prev,
      sqlConverterInput: value,
      sqlConverterOutput: prev.sqlConverterOutput,
    }));
  };

  const handleConvert = () => {
    if (!patchState.sqlConverterInput) {
      setPatchState((prev) => ({ ...prev, sqlConverterOutput: '-- No input SQL to convert.\n' }));
      return;
    }
    try {
      console.log('SQL Converter: Starting conversion...');
      const converted = convertSqlLogic(patchState.sqlConverterInput);
      setPatchState((prev) => ({ ...prev, sqlConverterOutput: converted }));
      logAnalyticsEvent('sql_converter_used', {
        input_length: (patchState.sqlConverterInput || '').length,
        output_length: converted.length,
      });
      console.log('SQL Converter: Conversion finished.');
    } catch (error) {
      console.error('Error during SQL conversion:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setPatchState((prev) => ({
        ...prev,
        sqlConverterOutput: `-- Error during conversion: ${errorMsg}\n`,
      }));
      logAnalyticsEvent('sql_converter_failed', { error_message: errorMsg });
    }
  };

  const handleCopy = () => {
    if (!patchState.sqlConverterOutput) return;
    navigator.clipboard
      .writeText(patchState.sqlConverterOutput)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy converted SQL: ', err);
        addToast('Failed to copy converted SQL to clipboard.', { type: 'error' });
      });
  };

  const handleDownload = () => {
    if (!patchState.sqlConverterOutput) return;
    const blob = new Blob([patchState.sqlConverterOutput], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_dokkan_patch_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logAnalyticsEvent('sql_converter_downloaded', {
      output_length: (patchState.sqlConverterOutput || '').length,
    });
  };

  return (
    <div className="card p-6 space-y-6">
      <h2 className="text-3xl font-bold text-[var(--clr-accent)] font-rajdhani border-b-2 border-[var(--clr-accent)] pb-2">
        SQL Converter (Remove Deprecated 'description' Fields)
      </h2>
      <p className="text-sm text-[var(--clr-text-muted)]">
        Paste your old SQL patch file content below. This tool will attempt to remove the deprecated
        'description' column from <code>passive_skill_sets</code> and <code>passive_skills</code>{' '}
        tables, making it compatible with recent updates. Itemized descriptions are not affected.
      </p>

      <div>
        <FormTextArea
          label="Old SQL Input"
          value={patchState.sqlConverterInput || ''}
          onChange={handleInputChange}
          rows={10}
          placeholder="Paste your old SQL here..."
          className="font-roboto-mono text-xs"
        />
      </div>

      <button onClick={handleConvert} className="w-full btn-primary py-3 px-4 text-lg">
        <i className="fas fa-magic mr-2"></i> Convert SQL
      </button>

      {patchState.sqlConverterOutput !== undefined && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold text-[var(--clr-accent)] font-rajdhani">
              Converted SQL Output
            </h3>
            <div className="space-x-2">
              <button
                onClick={handleCopy}
                disabled={!patchState.sqlConverterOutput}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-1.5`}></i>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!patchState.sqlConverterOutput}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-download mr-1.5"></i>
                Download
              </button>
            </div>
          </div>
          <pre className="bg-[var(--clr-bg-main)]/80 p-3 rounded-md text-xs text-[var(--clr-text-accent)] whitespace-pre-wrap break-all overflow-x-auto h-80 max-h-[50vh] border border-[var(--clr-border)] font-roboto-mono shadow-inner">
            {patchState.sqlConverterOutput || '-- Output will appear here...'}
          </pre>
        </div>
      )}
    </div>
  );
};
