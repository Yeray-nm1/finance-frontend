export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'checking' | 'savings';
  createdAt: string;
}
