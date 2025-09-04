
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronsUpDown } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type ProductPickerProps = {
  products: Product[];
  onProductSelect: (product: Product) => void;
  selectedProductName: string;
};

export function ProductPicker({ products, onProductSelect, selectedProductName }: ProductPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selectedProductName || 'Sélectionner un produit'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className='p-4 pb-0'>
          <DialogTitle>Sélectionner un Produit</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Rechercher un produit..." />
           <ScrollArea className="h-auto max-h-96">
            <CommandList>
              <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.reference}`}
                    onSelect={() => {
                      onProductSelect(product);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Réf: {product.reference} | Stock: {product.quantityInStock}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
