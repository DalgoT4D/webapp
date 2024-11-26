import * as React from 'react';
const SvgComponent = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" {...props}>
    <mask
      id="a"
      width={24}
      height={24}
      x={0}
      y={0}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: 'alpha',
      }}
    >
      <path fill="#D9D9D9" d="M0 0h24v24H0z" />
    </mask>
    <g mask="url(#a)">
      <path
        fill={props.fill || '#728090'}
        d="M2.803 18.82a.776.776 0 0 1-.572-.23.777.777 0 0 1-.231-.573c0-.227.077-.418.23-.571a.776.776 0 0 1 .573-.23h8.859c.227 0 .418.076.571.23.154.154.231.345.231.572a.776.776 0 0 1-.23.572.776.776 0 0 1-.572.23h-8.86Zm0-5.237a.776.776 0 0 1-.572-.23A.777.777 0 0 1 2 12.78c0-.227.077-.418.23-.571a.776.776 0 0 1 .573-.231H6.26c.227 0 .418.077.572.23.153.155.23.345.23.573a.777.777 0 0 1-.23.572.778.778 0 0 1-.572.23H2.803Zm0-5.237a.776.776 0 0 1-.572-.231A.777.777 0 0 1 2 7.543c0-.228.077-.418.23-.572a.776.776 0 0 1 .573-.23H6.26c.227 0 .418.077.572.23.153.155.23.345.23.573a.776.776 0 0 1-.23.572.778.778 0 0 1-.572.23H2.803Zm11.462 7.295c-1.341 0-2.484-.469-3.429-1.405-.945-.938-1.417-2.076-1.417-3.416 0-1.34.472-2.477 1.418-3.414C11.782 6.469 12.926 6 14.267 6c1.342 0 2.484.469 3.428 1.406.944.937 1.416 2.073 1.416 3.41 0 .496-.078.985-.233 1.466-.155.48-.384.921-.687 1.322l3.576 3.545a.731.731 0 0 1 .233.557.776.776 0 0 1-.233.571.748.748 0 0 1-.556.222.794.794 0 0 1-.571-.222l-3.576-3.546a4.707 4.707 0 0 1-1.333.677c-.48.155-.97.233-1.466.233Zm0-1.605c.9 0 1.665-.312 2.296-.937.63-.624.945-1.383.945-2.279 0-.895-.315-1.654-.945-2.279-.63-.624-1.396-.936-2.296-.936-.9 0-1.666.312-2.296.936-.63.625-.945 1.384-.945 2.28 0 .895.315 1.654.945 2.278.63.625 1.395.937 2.296.937Z"
      />
    </g>
  </svg>
);
export default SvgComponent;