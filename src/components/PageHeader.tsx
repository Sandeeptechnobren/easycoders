'use client';

import Breadcrumb from '@/components/Breadcrumb';


type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
};

export default function PageHeader({
  title,
  description,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="home-header-bg innerBanner">
      <div className="container">
        <div className="title-section mb-5">
          
          <Breadcrumb items={breadcrumbs} />

          <h1 className="heading1">{title}</h1>

          {description && <p>{description}</p>}

        </div>
      </div>
    </div>
  );
}