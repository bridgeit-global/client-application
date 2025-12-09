export type IssueCategory = 'bug' | 'feature' | 'support' | 'other';

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Issue {
    id: string;
    title: string;
    description: string;
    category: IssueCategory;
    status: IssueStatus;
    created_by: string;
    org_id: string;
    created_at: string;
    updated_at: string;
}

export interface IssueInsert {
    title: string;
    description: string;
    category: IssueCategory;
    status?: IssueStatus;
    created_by: string;
    org_id: string;
}

export interface IssueUpdate {
    title?: string;
    description?: string;
    category?: IssueCategory;
    status?: IssueStatus;
}
