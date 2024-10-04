import * as React from 'react';
const SvgComponent = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" {...props}>
    <path
      fill={props.fill || '#7D8998'}
      d="m16 23-3.8-3.8 1.05-1.05 2 2v-3.475h-6.5c-.433 0-.792-.142-1.075-.425-.283-.283-.425-.642-.425-1.075v-6.35H2v-1.5h5.25V3.85l-2 2L4.2 4.8 8 1l3.8 3.8-1.05 1.05-2-2v11.325H22v1.5h-5.25v3.475l2-2 1.05 1.05L16 23Zm-.75-9.325v-4.85h-5v-1.5h5c.433 0 .792.142 1.075.425.283.283.425.642.425 1.075v4.85h-1.5Z"
    />
  </svg>
);
export default SvgComponent;
