export interface TableSkeletonProps {
  /**
   * Show header card skeleton (title, badge, description)
   */
  showHeader?: boolean;
  
  /**
   * Show filter section skeleton
   */
  showFilters?: boolean;
  
  /**
   * Number of filter items to show
   */
  filterCount?: number;
  
  /**
   * Number of table columns
   */
  columnCount?: number;
  
  /**
   * Number of table rows
   */
  rowCount?: number;
  
  /**
   * Show pagination skeleton
   */
  showPagination?: boolean;
  
  /**
   * Show bulk action bar skeleton
   */
  showBulkActions?: boolean;
  
  /**
   * Custom class name for the container
   */
  className?: string;
}
