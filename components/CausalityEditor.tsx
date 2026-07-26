import React, { useState, useEffect } from 'react';
import {
    CausalityNode,
    CausalityNodeType,
    parseCausality,
    serializeCausality,
    createDefaultNode,
} from '../utils/causalityUtils';
import { CAUSALITY_TYPE_OPTIONS, CAUSALITY_TYPES } from '../constants';
import { SearchableSelect } from './SearchableSelect';
import { FormInput } from './FormControls';
import { DokkanID, SkillCausality } from '../types';
import { useToast } from '../context/ToastContext';

interface CausalityEditorProps {
    jsonString: string | null;
    onChange: (newValue: string | null) => void;
    skillCausalities: SkillCausality[];
    onCreateSkillCausality?: (
        causality_type: number,
        cau_val1: number | string,
        cau_val2: number | string,
        cau_val3: number | string
    ) => Promise<DokkanID>;
    isDbLoaded?: boolean;
    onFetchSkillCausality?: (id: DokkanID) => Promise<void>;
}

export const CausalityEditor: React.FC<CausalityEditorProps> = ({
    jsonString,
    onChange,
    skillCausalities,
    onCreateSkillCausality,
    isDbLoaded = false,
    onFetchSkillCausality,
}) => {
    const [rootNode, setRootNode] = useState<CausalityNode | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const isInternalChangeRef = React.useRef(false);

    useEffect(() => {
        // Don't re-parse if the change came from within this component
        if (isInternalChangeRef.current) {
            isInternalChangeRef.current = false;
            return;
        }

        const parsed = parseCausality(jsonString);
        setRootNode(parsed);
    }, [jsonString]);

    const handleUpdateRoot = (newNode: CausalityNode | null) => {
        setRootNode(newNode);
        const serialized = serializeCausality(newNode);

        // Mark this as an internal change to prevent re-parsing
        isInternalChangeRef.current = true;
        onChange(serialized || null);
    };

    if (!rootNode) {
        return (
            <div className="p-4 border border-dashed border-[var(--clr-border)] rounded-lg text-center">
                <p className="text-[var(--clr-text-muted)] mb-3">No causality conditions defined.</p>
                <button
                    onClick={() => handleUpdateRoot(createDefaultNode('CONDITION'))}
                    className="btn-primary-sm"
                >
                    <i className="fas fa-plus mr-2"></i>Add Condition
                </button>
            </div>
        );
    }

    return (
        <div className="causality-editor">
            <CausalityNodeItem
                node={rootNode}
                onChange={handleUpdateRoot}
                onRemove={() => handleUpdateRoot(null)}
                isRoot={true}
                skillCausalities={skillCausalities}
                onCreateSkillCausality={onCreateSkillCausality}
                isDbLoaded={isDbLoaded}
                onFetchSkillCausality={onFetchSkillCausality}
            />
        </div>
    );
};

interface CausalityNodeItemProps {
    node: CausalityNode;
    onChange: (newNode: CausalityNode) => void;
    onRemove: () => void;
    isRoot?: boolean;
    skillCausalities: SkillCausality[];
    onCreateSkillCausality?: (
        causality_type: number,
        cau_val1: number | string,
        cau_val2: number | string,
        cau_val3: number | string
    ) => Promise<DokkanID>;
    isDbLoaded?: boolean;
    onFetchSkillCausality?: (id: DokkanID) => Promise<void>;
}

const CausalityNodeItem: React.FC<CausalityNodeItemProps> = ({
    node,
    onChange,
    onRemove,
    isRoot,
    skillCausalities,
    onCreateSkillCausality,
    isDbLoaded,
    onFetchSkillCausality,
}) => {
    const { addToast } = useToast();
    useEffect(() => {
        if (
            node.type === 'REF' &&
            node.refId &&
            isDbLoaded &&
            onFetchSkillCausality
        ) {
            // Trigger fetch - the handler itself will check if it already exists
            onFetchSkillCausality(String(node.refId));
        }
    }, [node.type, node.refId, isDbLoaded, onFetchSkillCausality]);

    const handleTypeChange = (newType: CausalityNodeType) => {
        const newNode = createDefaultNode(newType);
        onChange(newNode);
    };

    const handleConditionTypeChange = (typeId: number) => {
        onChange({
            ...node,
            conditionType: typeId,
            conditionParams: [], // Reset params when type changes
        });
    };

    const handleParamChange = (index: number, val: string) => {
        const newParams = [...(node.conditionParams || [])];
        newParams[index] = val;
        onChange({ ...node, conditionParams: newParams });
    };

    const handleRefIdChange = (val: string) => {
        const numVal = Number(val);
        onChange({ ...node, refId: isNaN(numVal) ? 0 : numVal });
        if (!isNaN(numVal) && numVal > 0 && onFetchSkillCausality) {
            onFetchSkillCausality(String(numVal));
        }
    };

    const handleAddChild = () => {
        if (!node.children) return;
        const newChild = createDefaultNode('CONDITION');
        onChange({ ...node, children: [...node.children, newChild] });
    };

    const handleUpdateChild = (index: number, updatedChild: CausalityNode) => {
        if (!node.children) return;
        const newChildren = [...node.children];
        newChildren[index] = updatedChild;
        onChange({ ...node, children: newChildren });
    };

    const handleRemoveChild = (index: number) => {
        if (!node.children) return;
        const newChildren = node.children.filter((_, i) => i !== index);
        onChange({ ...node, children: newChildren });
    };

    const handleSaveToDb = async () => {
        if (!onCreateSkillCausality) {
            addToast('Database functionality not available.', { type: 'warning' });
            return;
        }
        if (node.type !== 'CONDITION') return;

        const type = node.conditionType || 0;
        const p1 = node.conditionParams?.[0] ?? 0;
        const p2 = node.conditionParams?.[1] ?? 0;
        const p3 = node.conditionParams?.[2] ?? 0;

        try {
            const newId = await onCreateSkillCausality(type, p1, p2, p3);
            // Convert this node to a REF node
            onChange({
                id: node.id,
                type: 'REF',
                refId: Number(newId), // Ensure it's a number if DokkanID is string but DB returns number-like
            });
        } catch (e) {
            console.error('Failed to save causality to DB:', e);
            addToast('Failed to save to database. Check console for details.', { type: 'error' });
        }
    };

    // Render Logic
    const isGroup = node.type === 'AND' || node.type === 'OR';
    const isNot = node.type === 'NOT';
    const isRef = node.type === 'REF';

    // Find referenced causality details
    const referencedCausality = isRef
        ? skillCausalities.find((sc) => Number(sc.id) === node.refId)
        : null;

    return (
        <div className="p-3 border border-[var(--clr-border)] rounded bg-[var(--clr-bg-secondary)] mb-2">
            <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--clr-accent)] font-rajdhani uppercase">
                        {node.type}
                    </span>
                    {isRoot && (
                        <span className="text-xs text-[var(--clr-text-muted)]">(Root)</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Type Switcher */}
                    <select
                        value={node.type}
                        onChange={(e) => handleTypeChange(e.target.value as CausalityNodeType)}
                        className="form-select text-xs py-1 px-2 h-8"
                    >
                        <option value="CONDITION">Condition (Inline)</option>
                        <option value="REF">Reference ID</option>
                        <option value="AND">AND Group</option>
                        <option value="OR">OR Group</option>
                        <option value="NOT">NOT Group</option>
                    </select>

                    <button onClick={onRemove} className="btn-danger-xs" title="Remove Node">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            {/* Content based on type */}
            {node.type === 'CONDITION' && (
                <div className="space-y-2">
                    <SearchableSelect
                        label="Condition Type"
                        value={node.conditionType || 0}
                        onChange={(val) => handleConditionTypeChange(Number(val))}
                        options={CAUSALITY_TYPE_OPTIONS}
                    />

                    {/* Params Inputs */}
                    {(() => {
                        const typeDef = CAUSALITY_TYPES[node.conditionType || 0];
                        if (!typeDef || !typeDef.params.length) return null;

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {typeDef.params.map((paramLabel, idx) => (
                                    <FormInput
                                        key={idx}
                                        label={paramLabel}
                                        value={node.conditionParams?.[idx] ?? ''}
                                        onChange={(val) => handleParamChange(idx, String(val))}
                                        className="text-sm"
                                    />
                                ))}
                            </div>
                        );
                    })()}

                    {/* Confirm Button */}
                    {onCreateSkillCausality && (
                        <div className="mt-2 p-2 bg-[var(--clr-bg-tertiary)] border border-[var(--clr-warning)] rounded border-dashed">
                            <div className="flex items-start gap-2 mb-2">
                                <i className="fas fa-exclamation-triangle text-[var(--clr-warning)] mt-1"></i>
                                <p className="text-xs text-[var(--clr-text-muted)]">
                                    This condition is currently <strong>inline</strong> and may not generate correct SQL for the game.
                                    Please confirm it to convert it to a valid Reference ID.
                                </p>
                            </div>
                            <button
                                onClick={handleSaveToDb}
                                className="btn-primary-xs w-full flex items-center justify-center gap-2"
                                title="Confirm this condition to generate a valid Reference ID"
                            >
                                <i className="fas fa-check-circle"></i> Confirm Condition
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isRef && (
                <div className="space-y-2">
                    <FormInput
                        label="Reference ID"
                        type="number"
                        value={node.refId || ''}
                        onChange={handleRefIdChange}
                        className="text-sm"
                    />
                    {referencedCausality ? (
                        <div className="text-xs p-2 bg-[var(--clr-bg-tertiary)] rounded border border-[var(--clr-border)]">
                            <p className="font-bold text-[var(--clr-accent)]">
                                Type: {referencedCausality.causality_type} -{' '}
                                {CAUSALITY_TYPES[referencedCausality.causality_type]?.name || 'Unknown'}
                            </p>
                            <p>
                                Params: {referencedCausality.cau_val1}, {referencedCausality.cau_val2},{' '}
                                {referencedCausality.cau_val3}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-[var(--clr-warning)] italic">
                            {isDbLoaded
                                ? 'ID not found in loaded database.'
                                : 'Database not loaded. Load a database to view reference details.'}
                        </p>
                    )}
                </div>
            )}

            {(isGroup || isNot) && (
                <div className="pl-4 border-l-2 border-[var(--clr-border)] mt-2 space-y-2">
                    {node.children?.map((child, idx) => (
                        <CausalityNodeItem
                            key={child.id}
                            node={child}
                            onChange={(updated) => handleUpdateChild(idx, updated)}
                            onRemove={() => handleRemoveChild(idx)}
                            skillCausalities={skillCausalities}
                            onCreateSkillCausality={onCreateSkillCausality}
                            isDbLoaded={isDbLoaded}
                            onFetchSkillCausality={onFetchSkillCausality}
                        />
                    ))}

                    {/* Add Button for Groups */}
                    {isGroup && (
                        <button onClick={handleAddChild} className="btn-secondary-xs w-full mt-2">
                            <i className="fas fa-plus mr-1"></i> Add Child Condition
                        </button>
                    )}
                    {/* Add Button for NOT if empty */}
                    {isNot && (!node.children || node.children.length === 0) && (
                        <button onClick={handleAddChild} className="btn-secondary-xs w-full mt-2">
                            <i className="fas fa-plus mr-1"></i> Set Condition
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
