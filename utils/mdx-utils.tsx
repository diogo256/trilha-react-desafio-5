import { api } from '../services/api'

export interface Post {
    id?: number;
    title?: string;
    description?: string;
    body?: string;
    created_at?: string;
    name?: string;
}

export interface CreatePostData {
    title: string;
    description: string;
    body: string;
    name: string;
}

export const getPosts = async (): Promise<Post[]> => {
    const { data } = await api.get<Post[]>('/posts');

    if (data) {
        return data;
    }

    return [];
}

export const getPostBySlug = async (id: string | number): Promise<Partial<Post>> => {
    const { data } = await api.get<Post[] | Post>(`/posts?id=eq.${id}`);

    if (data) {
        return Array.isArray(data) ? (data[0] || {}) : data;
    }

    return {};
}

export const createPost = async (postData: CreatePostData): Promise<Post | null> => {
    const { data } = await api.post<Post>('/posts', postData);

    if (data) {
        return data;
    }

    return null;
}