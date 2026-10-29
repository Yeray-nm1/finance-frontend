export interface TransactionsPaginationProps {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}
