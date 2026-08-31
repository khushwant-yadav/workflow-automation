import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@/components/ui/carousel';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type CategoryFilterCarouselProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  className?: string;
};

const CarouselContentWithButtons = ({
  className,
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const { canScrollNext, canScrollPrev } = useCarousel();

  return (
    <div
      className="relative my-3 py-2 border-b border-t border-border/60 bg-background/80 backdrop-blur-sm transition-[padding] duration-200"
      style={{
        paddingLeft: canScrollPrev ? '2.75rem' : '0',
        paddingRight: canScrollNext ? '2.75rem' : '0',
      }}
    >
      <CarouselContent className={cn('-ml-2 gap-1.5 items-center', className)}>
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <CarouselItem key={category} className="basis-auto pl-2">
              <button
                type="button"
                onClick={() => onCategorySelect(category)}
                className={cn(
                  'relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 outline-none select-none flex items-center justify-center',
                  isSelected
                    ? 'text-primary-foreground dark:text-black font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="aceternityActiveTab"
                    className="absolute inset-0 bg-primary dark:bg-white rounded-full shadow-sm -z-10"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      bounce: 0.15,
                    }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">
                  {category}
                </span>
              </button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {canScrollPrev && (
        <CarouselPrevious
          variant="ghost"
          className="left-1 z-10 h-8 w-8 rounded-full border bg-background/90 shadow-sm backdrop-blur-sm hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </CarouselPrevious>
      )}
      {canScrollNext && (
        <CarouselNext
          variant="ghost"
          className="right-1 z-10 h-8 w-8 rounded-full border bg-background/90 shadow-sm backdrop-blur-sm hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </CarouselNext>
      )}
    </div>
  );
};

export const CategoryFilterCarousel = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: false,
      }}
      className="w-full"
    >
      <CarouselContentWithButtons
        className={DASHBOARD_CONTENT_PADDING_X}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
    </Carousel>
  );
};
