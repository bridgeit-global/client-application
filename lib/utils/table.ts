export const getFilterDataLength = (filterBody: any) => {
    filterBody = { ...filterBody, limit: null, page: null, sort: null, order: null };
    return Object.entries(filterBody).filter(([key, value]: [any, any]) => value)
        .length;
};


export const defaultColumnSizing = {
    size: 150,
    minSize: 20,
    maxSize: Number.MAX_SAFE_INTEGER,
}
