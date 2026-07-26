import { CAUSALITY_TYPES } from '../constants';

// Internal representation of a causality node
export type CausalityNodeType = 'AND' | 'OR' | 'NOT' | 'CONDITION' | 'REF';

export interface CausalityNode {
    id: string; // Unique ID for UI keying
    type: CausalityNodeType;
    children?: CausalityNode[]; // For AND, OR, NOT
    conditionType?: number; // For CONDITION (0-63)
    conditionParams?: (number | string)[]; // For CONDITION
    refId?: number; // For REF
}

// Helper to generate unique IDs for the UI
let nodeIdCounter = 0;
const generateNodeId = () => `node_${Date.now()}_${nodeIdCounter++}`;

// Parse the "compiled" JSON structure into our internal tree
export const parseCausality = (jsonString: string | null | undefined): CausalityNode | null => {
    if (!jsonString) return null;

    try {
        const parsed = JSON.parse(jsonString);
        let compiledData = parsed;
        if (parsed && typeof parsed === 'object' && 'compiled' in parsed) {
            compiledData = parsed.compiled;
        }

        return parseCompiledNode(compiledData);
    } catch (e) {
        console.error('Failed to parse causality JSON:', e);
        return null;
    }
};

const parseCompiledNode = (data: any): CausalityNode => {
    // Handle direct ID reference (number or numeric string)
    if (typeof data === 'number') {
        return {
            id: generateNodeId(),
            type: 'REF',
            refId: data,
        };
    }
    if (typeof data === 'string' && !isNaN(Number(data))) {
        return {
            id: generateNodeId(),
            type: 'REF',
            refId: Number(data),
        };
    }

    // Data is expected to be an array: ["&", child1, child2] or ["type", typeId, [params]]
    if (!Array.isArray(data) || data.length === 0) {
        // Fallback or error
        return { id: generateNodeId(), type: 'CONDITION', conditionType: 0, conditionParams: [] };
    }

    const operator = data[0];

    if (operator === '&') {
        return {
            id: generateNodeId(),
            type: 'AND',
            children: data.slice(1).map(parseCompiledNode),
        };
    } else if (operator === '|') {
        return {
            id: generateNodeId(),
            type: 'OR',
            children: data.slice(1).map(parseCompiledNode),
        };
    } else if (operator === 'not') {
        return {
            id: generateNodeId(),
            type: 'NOT',
            children: data.slice(1).map(parseCompiledNode),
        };
    } else if (operator === 'type') {
        const typeId = typeof data[1] === 'number' ? data[1] : parseInt(data[1] || '0');
        const params = Array.isArray(data[2]) ? data[2] : [];
        return {
            id: generateNodeId(),
            type: 'CONDITION',
            conditionType: typeId,
            conditionParams: params,
        };
    }

    // Unknown format, treat as empty condition
    return { id: generateNodeId(), type: 'CONDITION', conditionType: 0, conditionParams: [] };
};

// Serialize our internal tree back to the "compiled" JSON structure
export const serializeCausalityCompiled = (node: CausalityNode): any => {
    if (node.type === 'REF') {
        return node.refId || 0;
    } else if (node.type === 'AND') {
        return ['&', ...(node.children || []).map(serializeCausalityCompiled)];
    } else if (node.type === 'OR') {
        return ['|', ...(node.children || []).map(serializeCausalityCompiled)];
    } else if (node.type === 'NOT') {
        const child = node.children && node.children.length > 0 ? node.children[0] : null;
        return ['not', child ? serializeCausalityCompiled(child) : null];
    } else if (node.type === 'CONDITION') {
        return ['type', node.conditionType || 0, node.conditionParams || []];
    }
    return null;
};

// Generate a human-readable "source" string from the tree
export const generateSourceString = (node: CausalityNode): string => {
    if (node.type === 'REF') {
        return String(node.refId || 0);
    } else if (node.type === 'AND') {
        const children = (node.children || []).map(generateSourceString);
        // If children are simple, maybe don't need parens? For safety, use parens.
        return `(${children.join('&')})`;
    } else if (node.type === 'OR') {
        const children = (node.children || []).map(generateSourceString);
        return `${children.join('|')}`; // OR usually has lower precedence, but let's keep it simple like 43|3429
    } else if (node.type === 'NOT') {
        const child = node.children && node.children.length > 0 ? node.children[0] : null;
        return `not ${child ? generateSourceString(child) : ''}`;
    } else if (node.type === 'CONDITION') {
        const typeDef = CAUSALITY_TYPES[node.conditionType || 0];
        const name = typeDef ? typeDef.name : `Type${node.conditionType}`;
        const params = (node.conditionParams || []).join(',');
        return `${name}(${params})`;
    }
    return '';
};

// Full serialization to the {"source": ..., "compiled": ...} format
export const serializeCausality = (node: CausalityNode | null): string => {
    if (!node) return '';
    const compiled = serializeCausalityCompiled(node);
    const source = generateSourceString(node);
    return JSON.stringify({ source, compiled });
};

export const createDefaultNode = (type: CausalityNodeType = 'CONDITION'): CausalityNode => {
    return {
        id: generateNodeId(),
        type,
        children: (type === 'AND' || type === 'OR' || type === 'NOT') ? [] : undefined,
        conditionType: type === 'CONDITION' ? 0 : undefined,
        conditionParams: type === 'CONDITION' ? [] : undefined,
        refId: type === 'REF' ? 0 : undefined,
    };
};
