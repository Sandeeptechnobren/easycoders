'use client';

import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="breadcrumbWrap">
    
        <nav className="breadcrumb">
          {items.map((item, index) => (
            <span key={index}>
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span className="active">{item.label}</span>
              )}

              {index < items.length - 1 && (
                <span className="separator"> / </span>
              )}
            </span>
          ))}
        </nav>
 
    </div>
  );
}