# Dynamic Chart System

This directory contains an optimized and dynamic chart rendering system that supports multiple chart types and libraries.

## Features

### 🎯 Dynamic Chart Type Support
The system now supports multiple chart types with automatic configuration:

- **Bar Charts** (📊) - Compare discrete categories
- **Line Charts** (📈) - Show trends over time
- **Area Charts** (📉) - Show volume or cumulative values
- **Pie Charts** (🥧) - Show parts of a whole with percentages
- **Scatter Plots** (🔵) - Show correlation between variables
- **Funnel Charts** (📐) - Show progressive reduction through stages
- **Heatmaps** (🔥) - Show data intensity across dimensions (planned)
- **Radar Charts** (🎯) - Compare multiple metrics (planned)

### 🔧 Automatic Configuration
- **Data Validation**: Automatically validates data against chart type requirements
- **Smart Recommendations**: Suggests the best chart type based on your data
- **Title Suggestions**: Auto-generates meaningful chart titles
- **Dynamic Layouts**: Adjusts chart size and layout based on data volume

### 🎨 Visual Enhancements
- **Color Palettes**: Multiple color schemes (default, pastel, vibrant, etc.)
- **Responsive Design**: Charts adapt to different screen sizes
- **Interactive Features**: Zoom, pan, tooltips, and data exploration
- **Loading States**: Smooth loading and error states

## Architecture

### Core Files

- `EChartsComponent.tsx` - Main optimized ECharts component
- `chartUtils.ts` - Utility functions and configurations
- `ChartForm.tsx` - Enhanced form with dynamic chart type selection

### Chart Configuration System

```typescript
interface ChartTypeConfig {
  name: string;
  icon: string;
  description: string;
  supportedLibraries: ('echarts' | 'nivo' | 'recharts')[];
  dataRequirements: {
    minDataPoints: number;
    maxDataPoints?: number;
    xAxisType: 'category' | 'value' | 'time' | 'any';
    yAxisType: 'value' | 'category' | 'any';
  };
}
```

## Usage

### Basic Example

```tsx
import EChartsComponent from './components/charts/EChartsComponent';

<EChartsComponent
  data={{
    'x-axis': ['Jan', 'Feb', 'Mar', 'Apr'],
    'y-axis': [120, 200, 150, 80]
  }}
  chartName="Monthly Sales"
  chartDescription="Sales data for Q1"
  chartType="bar"
  xAxisLabel="Month"
  yAxisLabel="Sales ($)"
/>
```

### Advanced Example with Custom Options

```tsx
<EChartsComponent
  data={myData}
  chartName="Advanced Analytics"
  chartType="line"
  customOptions={{
    animation: true,
    animationDuration: 1000,
    backgroundColor: '#f5f5f5'
  }}
/>
```

### Using Chart Utilities

```tsx
import { 
  validateChartData, 
  getRecommendedChartType,
  generateChartTitleSuggestions 
} from './chartUtils';

// Validate data
const validation = validateChartData(data, 'pie');
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}

// Get recommendations
const recommendedType = getRecommendedChartType(data, 'echarts');
const titleSuggestions = generateChartTitleSuggestions('Date', 'Revenue', 'line');
```

## Extending the System

### Adding New Chart Types

1. **Add to Chart Configuration** in `chartUtils.ts`:

```typescript
export const CHART_TYPE_CONFIGS = {
  // ... existing types
  newChartType: {
    name: 'New Chart Type',
    icon: '📊',
    description: 'Description of what this chart shows',
    supportedLibraries: ['echarts'],
    dataRequirements: {
      minDataPoints: 2,
      xAxisType: 'category',
      yAxisType: 'value'
    }
  }
};
```

2. **Add Chart Generation Logic** in `EChartsComponent.tsx`:

```typescript
case 'newChartType':
  return {
    ...baseOption,
    series: [{
      type: 'newType',
      data: transformedData,
      // ... chart-specific options
    }]
  };
```

3. **Add Data Transformation** if needed:

```typescript
case 'newChartType':
  return data['y-axis'].map((value, index) => ({
    // Transform data for new chart type
  }));
```

### Adding New Color Palettes

```typescript
export const COLOR_PALETTES = {
  // ... existing palettes
  custom: ['#color1', '#color2', '#color3']
};
```

### Adding Validation Rules

```typescript
// In validateChartData function
if (chartType === 'newType') {
  // Add specific validation logic
  if (someCondition) {
    errors.push('Specific error message');
  }
}
```

## Performance Optimizations

### Implemented Optimizations

1. **Lazy Rendering**: Charts only render when data is available
2. **Dynamic Heights**: Chart container height adapts to data size
3. **Canvas Rendering**: Uses canvas instead of SVG for better performance
4. **Data Zoom**: Built-in zoom for large datasets
5. **Not Merge**: Prevents unnecessary re-renders with `notMerge={true}`

### Memory Management

- Automatic cleanup of chart instances
- Efficient data transformation
- Minimal re-renders through proper state management

## Testing

The system includes validation and error handling:

- Data validation before rendering
- Graceful fallbacks for invalid data
- Error boundaries for component failures
- Console logging for debugging

## Future Enhancements

### Planned Features

1. **Map Charts**: Geographic data visualization
2. **3D Charts**: Three-dimensional data representation
3. **Animation Presets**: Pre-configured animation styles
4. **Export Options**: PDF, PNG, SVG export functionality
5. **Real-time Data**: WebSocket support for live updates
6. **Custom Themes**: User-defined color themes and styling

### Performance Improvements

1. **Virtual Scrolling**: For very large datasets
2. **Web Workers**: Background data processing
3. **Incremental Loading**: Progressive data loading
4. **Caching**: Intelligent chart configuration caching

## Best Practices

### Data Preparation

- Ensure consistent data types
- Handle missing values appropriately
- Limit data points based on chart type requirements
- Use meaningful labels for axes

### Chart Selection

- Use bar charts for categorical comparisons
- Use line charts for time series data
- Use pie charts for parts-of-whole (max 8-10 categories)
- Use scatter plots for correlation analysis

### Performance

- Limit data points: <50 for pie charts, <1000 for line charts
- Use data zoom for large datasets
- Consider chart type switching for different data sizes
- Implement loading states for slow data fetching

## Troubleshooting

### Common Issues

1. **Chart not rendering**: Check data format and validation
2. **Performance issues**: Reduce data points or use data zoom
3. **Type errors**: Ensure proper TypeScript types
4. **Style issues**: Check CSS conflicts and container sizing

### Debug Mode

Enable debug logging:

```typescript
// In chart generation
console.log('Chart data:', data);
console.log('Chart type:', chartType);
console.log('Validation:', validateChartData(data, chartType));
``` 