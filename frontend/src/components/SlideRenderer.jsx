import React from 'react';
import DefaultLayout from './layouts/DefaultLayout';
import ComparisonLayout from './layouts/ComparisonLayout';
import TimelineLayout from './layouts/TimelineLayout';
import GridListLayout from './layouts/GridListLayout';
import StatCalloutLayout from './layouts/StatCalloutLayout';
import PieChartLayout from './layouts/PieChartLayout';
import BarChartLayout from './layouts/BarChartLayout';
import DataTableLayout from './layouts/DataTableLayout';
import BentoGridLayout from './layouts/BentoGridLayout';
import MetricDashboardLayout from './layouts/MetricDashboardLayout';

export default function SlideRenderer({ slide, slideSize }) {
  if (!slide) return null;

  const type = slide.slide_type || 'default';

  let aspectClass = "aspect-video"; // default 16:9
  if (slideSize === 'LAYOUT_4x3') aspectClass = "aspect-[4/3]";
  if (slideSize === 'LAYOUT_16x10') aspectClass = "aspect-[16/10]";

  const containerStyle = `${aspectClass} w-full rounded-2xl p-8 overflow-hidden relative`;

  let layoutComponent;
  switch (type) {
    case 'comparison':
      layoutComponent = <ComparisonLayout slide={slide} />;
      break;
    case 'timeline':
      layoutComponent = <TimelineLayout slide={slide} />;
      break;
    case 'stat_callout':
      layoutComponent = <StatCalloutLayout slide={slide} />;
      break;
    case 'grid_list':
      layoutComponent = <GridListLayout slide={slide} />;
      break;
    case 'chart_pie':
      layoutComponent = <PieChartLayout slide={slide} />;
      break;
    case 'chart_bar':
      layoutComponent = <BarChartLayout slide={slide} />;
      break;
    case 'data_table':
      layoutComponent = <DataTableLayout slide={slide} />;
      break;
    case 'bento_grid':
      layoutComponent = <BentoGridLayout slide={slide} />;
      break;
    case 'metric_dashboard':
      layoutComponent = <MetricDashboardLayout slide={slide} />;
      break;
    case 'default':
    default:
      layoutComponent = <DefaultLayout slide={slide} />;
      break;
  }

  // We rely on Workspace.jsx assigning the dynamic background color class, 
  // but we enforce the dimensions here
  return (
    <div className={containerStyle}>
       {layoutComponent}
    </div>
  );
}
