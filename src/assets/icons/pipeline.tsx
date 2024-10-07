import * as React from 'react';
const SvgComponent = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" {...props}>
    <path
      fill={props.fill || '#7D8998'}
      fillRule="evenodd"
      d="M22.382 5.73a1.73 1.73 0 0 1-3.343.625h-4.252l-1.14.76-.35.234a7.088 7.088 0 0 1 1.848 3.81h3.995a1.73 1.73 0 1 1-.17 1.25h-3.75a7.075 7.075 0 0 1-1.234 3.817l1.703 1.42h3.35a1.73 1.73 0 1 1 0 1.25h-3.802l-.174-.146-1.87-1.558A7.111 7.111 0 1 1 12.33 6.49l.623-.416 1.297-.865.158-.105H19.038a1.73 1.73 0 0 1 3.344.625ZM2.25 12.216a5.861 5.861 0 1 1 11.723 0 5.861 5.861 0 0 1-11.723 0Z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgComponent;
