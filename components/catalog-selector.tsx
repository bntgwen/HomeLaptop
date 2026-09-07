'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface CatalogOption {
  id: string
  title: string
  category?: string | null
  price?: number | null
  stock?: number | null
  description?: string | null
  image_url?: string | null
  image_urls?: string[] | null
}



export interface SelectedTicketItem {
  catalog_id: string
  item_name: string
  price: number
  quantity: number
}

interface CatalogSelectorProps {
  catalogs: CatalogOption[]
  selectedItems: SelectedTicketItem[]
  onChange: (items: SelectedTicketItem[]) => void
}

export function CatalogSelector({ catalogs, selectedItems, onChange }: CatalogSelectorProps) {
  const [search, setSearch] = useState('')

  const formatRupiah = (val?: number | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val ?? 0)
  }


  const handleAddItem = (catalog: CatalogOption) => {
    const existingIndex = selectedItems.findIndex((item) => item.catalog_id === catalog.id)
    if (existingIndex > -1) {
      // Jika sudah ada, tambah quantity
      const updated = [...selectedItems]
      updated[existingIndex].quantity += 1
      onChange(updated)
    } else {
      // Tambahkan item baru
      onChange([
        ...selectedItems,
        {
          catalog_id: catalog.id,
          item_name: catalog.title,
          price: catalog.price ?? 0,
          quantity: 1,
        },
      ])
    }
  }

  const handleQuantityChange = (catalogId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(catalogId)
      return
    }
    const updated = selectedItems.map((item) =>
      item.catalog_id === catalogId ? { ...item, quantity: qty } : item
    )
    onChange(updated)
  }

  const handleRemoveItem = (catalogId: string) => {
    const updated = selectedItems.filter((item) => item.catalog_id !== catalogId)
    onChange(updated)
  }

  const filteredCatalogs = catalogs.filter((c) =>
    (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(search.toLowerCase())
  )


  const totalCost = selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0)

  return (
    <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
      <div className="flex justify-between items-center">
        <div>
          <Label className="font-semibold text-sm">Item / Sparepart / Layanan Tambahan</Label>
          <p className="text-xs text-muted-foreground">Pilih komponen atau layanan katalog untuk tiket ini</p>
        </div>
        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
          Total: {formatRupiah(totalCost)}
        </span>
      </div>

      {/* Pencarian Item Katalog */}
      <Input
        type="text"
        placeholder="Cari sparepart/katalog..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-xs h-8"
      />

      {/* List Rekomendasi Pilihan Item */}
      {search && (
        <div className="max-h-36 overflow-y-auto divide-y border rounded-lg bg-card text-card-foreground text-xs shadow-inner">
          {filteredCatalogs.length > 0 ? (
            filteredCatalogs.map((cat) => (
              <div key={cat.id} className="p-2 flex justify-between items-center hover:bg-muted/50">
                <div>
                  <p className="font-medium">{cat.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {cat.category || 'Layanan'} • {formatRupiah(cat.price)} (Stok: {cat.stock ?? 0})
                  </p>

                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 text-[10px] px-2"
                  onClick={() => handleAddItem(cat)}
                >
                  + Tambah
                </Button>
              </div>
            ))
          ) : (
            <p className="p-3 text-center text-muted-foreground text-xs">Item tidak ditemukan</p>
          )}
        </div>
      )}

      {/* Tabel Item yang Dipilih */}
      {selectedItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Item Terpilih ({selectedItems.length}):</p>
          <div className="divide-y border rounded-lg bg-card overflow-hidden text-xs">
            {selectedItems.map((item) => (
              <div key={item.catalog_id} className="p-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.item_name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {formatRupiah(item.price)} x {item.quantity} = <span className="font-semibold text-foreground">{formatRupiah(item.price * item.quantity)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.catalog_id, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-14 border rounded px-1.5 py-0.5 text-center font-mono bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.catalog_id)}
                    className="text-red-500 hover:text-red-700 text-xs px-1.5 py-0.5 rounded font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic text-center py-2">
          Belum ada item/sparepart yang ditambahkan ke tiket ini.
        </p>
      )}
    </div>
  )
}
