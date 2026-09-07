'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
  images: string[]
  title: string
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const activeImage = images[activeIdx] || null

  return (
    <div className="space-y-3">
      {/* Gambar Utama Besar */}
      <div className="relative aspect-video sm:aspect-square w-full rounded-2xl border bg-muted/40 overflow-hidden shadow-sm">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6">
            <span className="text-4xl mb-2">💻</span>
            <span className="text-sm">Foto belum tersedia</span>
          </div>
        )}
      </div>

      {/* Thumbnails bar jika ada > 1 foto */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                activeIdx === idx
                  ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-sm'
                  : 'border-muted hover:border-foreground/30 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
