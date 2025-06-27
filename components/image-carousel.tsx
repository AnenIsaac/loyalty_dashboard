"use client"

import { useState } from "react"
import Image from "next/image"

const slides = [
  {
    src: "/images/carousel/slide1.jpg",
    alt: "Welcome to Zawadii - Slide 1"
  },
  {
    src: "/images/carousel/slide2.jpg",
    alt: "Discover Rewards - Slide 2"
  },
  {
    src: "/images/carousel/slide3.jpg",
    alt: "Join the Loyalty Program - Slide 3"
  }
]

export function ImageCarousel() {
  const [current, setCurrent] = useState(0)

  const nextSlide = () => setCurrent((current + 1) % slides.length)
  const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length)

  return (
    <div className="relative flex-1 h-full flex flex-col items-center justify-center bg-gray-100">
      <div className="relative w-full h-full flex-1 flex items-center justify-center">
        <Image
          src={slides[current].src}
          alt={slides[current].alt}
          fill
          className="object-cover rounded-2xl"
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </div>
      <div className="flex justify-center mt-4 gap-2 absolute bottom-8 left-0 right-0 z-10">
        {slides.map((slide, idx) => (
          <button
            key={slide.src}
            className={`w-3 h-3 rounded-full ${current === idx ? 'bg-orange-500' : 'bg-gray-300'}`}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow hover:bg-opacity-100 z-10"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        &#8592;
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow hover:bg-opacity-100 z-10"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        &#8594;
      </button>
    </div>
  )
}

export default ImageCarousel;
