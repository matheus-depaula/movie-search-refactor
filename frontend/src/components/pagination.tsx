import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Chevron } from "@/components/ui/Chevron";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const MAX_VISIBLE_PAGES = 5;

  const { pages, startPage, endPage } = useMemo(() => {
    const halfVisible = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }

    const pageNumbers = Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );

    return { pages: pageNumbers, startPage: start, endPage: end };
  }, [currentPage, totalPages]);

  const showFirstPage = startPage > 1;
  const showLastPage = endPage < totalPages;
  const showFirstEllipsis = startPage > 2;
  const showLastEllipsis = endPage < totalPages - 1;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <Chevron side="left" className="h-4 w-4" />
      </Button>

      {showFirstPage && (
        <>
          <Button
            variant="secondary"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {showFirstEllipsis && <span className="text-muted-foreground">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "secondary"}
          onClick={() => onPageChange(page)}
          className={page === currentPage ? "bg-gradient-primary" : ""}
        >
          {page}
        </Button>
      ))}

      {showLastPage && (
        <>
          {showLastEllipsis && <span className="text-muted-foreground">...</span>}
          <Button
            variant="secondary"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="secondary"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <Chevron side="right" className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
