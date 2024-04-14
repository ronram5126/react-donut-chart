import React, { useEffect, useState } from 'react';
import ArcPath from './ArcPath';
import LegendItem from './LegendItem';
import color from './Color';
import { IChartProps } from './Interfaces';

export type Item = {
  className?: string;
  isEmpty?: boolean;
  label: string;
  value: number;
};

export type ItemWithRenderProps = Item & {
  angle: number;
  classNames: string;
  clickHandlers?: {
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  fill: string;
  index: number;
  opacity: number;
  stroke: string;
};


export type Colors = string[];

function getContainerStyle(
  legendSide: string,
  horizontalAlign: string,
  verticalAlign: string,
  wrapToTop: boolean
): any {
  const isVertical = legendSide === "top" || legendSide === "bottom";
  const isReverse = legendSide === "top" || legendSide === "left";

  const verticalProperty = isVertical? "justifyContent": "alignItems";
  const horizontalProperty = isVertical? "alignItems": "justifyContent";
  
  const horizontalValue = { 
    "left": isReverse? "flex-end" : "flex-start",
    "center": "center",
    "right": isReverse? "flex-start" : "flex-end" 
  }[horizontalAlign];

  const verticalValue = { 
    "top": isReverse? "flex-end" : "flex-start",
    "middle": "center",
    "bottom": isReverse? "flex-start" : "flex-end"
  }[verticalAlign];

  const flexDirection = (isVertical? "column" : "row") + (isReverse? "-reverse" : "");
  const flexWrap = wrapToTop? "wrap-reverse" : "wrap";

  return {
    display:"flex",
    gap: "2em",
    maxWidth: "100%",
    width: "max-content",
    [verticalProperty]: verticalValue,
    [horizontalProperty]: horizontalValue,
    flexDirection, flexWrap
  }
}


const DonutChart: React.FC<IChartProps> = ({
  data = [
    {
      className: '',
      label: '',
      value: 100,
      isEmpty: true,
    },
  ],
  colors = color,
  emptyColor = '#e0e0e0',
  className = 'donutchart',
  clickToggle = true,
  colorFunction = (colors, index) => colors[index % colors.length],
  formatValues = (value, total) => Number.isNaN(value / total)? '--'
    : `${((value / total) * 100).toFixed(2)}%`,
  
  interactive = true,
  onClick = (item, toggled) => (toggled ? item : null),
  onMouseEnter = (item) => item,
  onMouseLeave = (item) => item,

  chartSize = 750,
  innerRadius = 0.7,
  outerRadius = 0.9,
  emptyOffset = 0.08,
  toggledOffset = 0.04,
  selectedOffset = 0.03,
  strokeColor = 'item-color',
  forceChartWidth,
  legend = true,
  legendSide = 'right',
  horizontalAlign = 'left',
  verticalAlign = 'middle',
  wrapToTop = false,
  selectionOpacity = 0.5,
  labelRenderer
}) => {
  const [selected, setSelected] = useState(interactive ? data[0] : null);
  const [toggleSelect, setToggleSelect] = useState(false);

  useEffect(() => {
    if (interactive) {
      setSelected(data[0]);
      setToggleSelect(false);
    }
  }, [interactive, data]);

  const total = data.reduce((sum, { value }) => sum + value, 0);
  const { dataWithRenderProps } = data.reduce(
    ({ angle, dataWithRenderProps }, item, index) => {
      const { className, isEmpty, label, value } = item;
      const isSelected = selected?.label === label;
      const isToggled = isSelected && toggleSelect;

      return {
        angle: angle + (value / total) * 360,
        dataWithRenderProps: [
          ...dataWithRenderProps,
          {
            angle,
            index,
            ...item,
            classNames: `${className ?? ''} ${isEmpty ? 'empty' : ''} ${
              isSelected ? 'selected' : ''
            } ${isToggled ? 'toggled' : ''}`.trim(),
            fill: isEmpty ? emptyColor : colorFunction(colors, index),
            opacity: isSelected && !toggleSelect ? selectionOpacity : 1,
            stroke: isEmpty ? emptyColor 
              : strokeColor === 'item-color' ? colorFunction(colors, index) 
              : strokeColor,
            clickHandlers: interactive
              ? {
                  onClick: () => {
                    if (selected?.label === label) {
                      const toggle = clickToggle ? !toggleSelect : false;
                      setSelected(item);
                      setToggleSelect(toggle);
                      onClick(item, toggle);
                    }
                  },
                  onMouseEnter: () => {
                    if (!toggleSelect) {
                      setSelected(item);
                      onMouseEnter(item);
                    }
                  },

                  onMouseLeave: () => {
                    if (!toggleSelect) {
                      onMouseLeave(item);
                    }
                  },
                }
              : undefined,
          },
        ],
        total: total + value,
      };
    },
    { angle: -90, dataWithRenderProps: [] as ItemWithRenderProps[] }
  );
  let containerStyle = getContainerStyle(legendSide, horizontalAlign, verticalAlign, wrapToTop);
  const maxLabelLength = (data
    .sort((a, b) => b.label.length - a.label.length)[0]?.label?.length || 10) + 2;

  return (
    <div className={`${className}-container`} style={containerStyle}>     
      <div className={`${className}-graph`} style={{
        display: "flex",
        flexWrap: "nowrap",
        justifyContent:"center",
        alignItems: "center",
        position: "relative",
        width: ((forceChartWidth || maxLabelLength) + "em"),
        height: ((forceChartWidth || maxLabelLength) + "em"),
        textAlign: "center"
      }}>
        <svg
            className={className}
            style={{ 
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
            viewBox={`0 0 ${chartSize} ${chartSize}`}
          >
            <g
              className={`${className}-arcs`}
            >
              {dataWithRenderProps.map((item) => (
                <ArcPath 
                  key={`arcpath${item.index}`} 
                  {...{
                    item,
                    className,
                    emptyOffset,
                    chartSize,
                    innerRadius,
                    outerRadius,
                    selected,
                    selectedOffset,
                    toggledOffset,
                    toggleSelect,
                    total
                  }}
                />
              ))}
            </g>
          </svg>
            {selected && (
              <div className={`${className}-innertext`}>
                <div
                  className={`${className}-innertext-label`}
                >
                  {selected.label || " "}
                </div>
                <div className={`${className}-innertext-value`}>
                  {formatValues(selected.value, total)}
                </div>
              </div>
            )}
      </div>
        
      {legend && (
        <div className={`${className}-legend`}>
          {dataWithRenderProps
            .map((item) => (
              <LegendItem
                key={`legenditem${item.index}`}
                item={item}
                className={className}
                labelRenderer={labelRenderer}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
