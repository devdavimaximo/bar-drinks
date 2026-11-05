const base = `${import.meta.env.BASE_URL}media/`;

/** fotos geradas por scripts/images.mjs em 900, 1300 e 1800 px de largura */
export default function Img({ src, alt, sizes = '100vw', className, eager = false }: { src: string; alt: string; sizes?: string; className?: string; eager?: boolean }) {
  return (
    <img
      className={className}
      src={`${base}${src}-900.webp`}
      srcSet={`${base}${src}-900.webp 900w, ${base}${src}-1300.webp 1300w, ${base}${src}-1800.webp 1800w`}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}
