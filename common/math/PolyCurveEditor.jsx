import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import styled from "styled-components";
import PropTypes from 'prop-types'

import Slider from 'rc-slider';

import {CoolStyles} from "common/ui/styles/CoolStyles";
import LinearEquation from "common/math/LinearEquation";

const BlockWrapper = styled(CoolStyles.Block)`
    ${CoolStyles.noselect}
`;

const TestFieldWrapper = styled(CoolStyles.InlineBlock)`
    ${CoolStyles.noselect}
    padding: 0.5rem 0 1rem;
    border: 0.15rem solid #666666;
    border-radius: 0.25rem;
    background-color: #eeeeee;
    position: relative;    
`;

const VerticalSlider = styled(Slider)`
    width: 0.3125rem;
    height: 10rem;
    background-color: #eeeeee;
`;

const SliderWrapper = styled(CoolStyles.InlineBlock)`
    margin: 0 2rem;
    z-index: 100;
`;

const CanvasField = styled.canvas`
    position: relative;    
`;

export class PolyCurveEditor extends Component {

   static propTypes = {
      inputs: PropTypes.array.isRequired,
      on_update: PropTypes.func.isRequired,
   };

   state = {
      coefficients: [],
      width_px: 0,
      height_px: 0,
      canvas_ref: React.createRef(),
      slider_refs: [],
      values: [],
      ctx: null,
      point_count: 0,
      canvas_top: 0,
      canvas_left: 0,
      poly_matrix: [],
      extrema: {min: -1.0, max: 1.0},
   }

   componentDidMount() {
      const {canvas_ref} = this.state;
      const {inputs} = this.props;
      const canvas = canvas_ref.current;
      if (!canvas) {
         console.log('no canvas');
         return;
      }
      const ctx = canvas.getContext('2d');

      // get the width and height from the container
      const parent_node = ReactDOM.findDOMNode(this).parentNode
      const parent_rect = parent_node.getBoundingClientRect();

      // get the extrema
      this.set_extrema();

      let slider_refs = [];
      for (let i = 0; i < inputs.length; i++) {
         slider_refs.push(React.createRef());
      }
      this.setState({
         ctx: ctx,
         slider_refs: slider_refs,
         point_count: inputs.length,
         width_px: parent_rect.width,
         height_px: parent_rect.height
      });
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      const {inputs} = this.props;
      if (JSON.stringify(inputs) !== JSON.stringify(prevProps.inputs)) {
         //this.set_extrema();
      }
   }

   set_extrema = () => {
      const {inputs} = this.props;
      let max = -1000000;
      let min = 1000000;
      inputs.forEach(value => {
         if (value > max) {
            max = value;
         }
         if (value < min) {
            min = value;
         }
      });
      const span = max - min;
      this.setState({
         extrema: {
            max: max + span / 10,
            min: min - span / 10
         }
      });
   }

   static get_menu_options = (segment_data) => {
      if (!segment_data) {
         return [];
      }
      return [
         {label: "go to there", code: 1},
      ];
   }

   set_slider_value = (index, value) => {
      const {point_count, poly_matrix} = this.state;
      const {inputs, on_update} = this.props;
      const new_inputs = Object.assign({}, inputs)
      new_inputs[index] = value;
      on_update(new_inputs, index)

      const coefficients = LinearEquation.solve(poly_matrix, inputs);
      let values = [];
      for (let t = 0.0; t <= point_count - 1; t += 0.025) {
         let t_powers = [1, t];
         let t_power_value = t;
         for (let i = 2; i < point_count; i++) {
            t_power_value *= t;
            t_powers.push(t_power_value);
         }
         let value = 0;
         for (let i = 0; i < point_count; i++) {
            value += coefficients[i] * t_powers[point_count - i - 1];
         }
         values.push({t: t, value: value});
      }
      this.fill_canvas(values);
      this.setState({
         coefficients: coefficients,
         values: values,
      })
   }

   fill_canvas = (values) => {
      const {ctx, width_px, height_px, point_count} = this.state;
      let coords = [];
      values.forEach(v => {
         const x = (v.t * width_px) / (point_count - 1);
         const y = height_px - (v.value * height_px);
         coords.push({x: x, y: y});
      })
      let region = new Path2D();
      region.moveTo(coords[0].x, coords[0].y);
      for (let i = 1; i < coords.length; i++) {
         region.lineTo(coords[i].x, coords[i].y);
      }
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(0, 0, width_px, height_px);
      ctx.strokeStyle = "black";
      ctx.stroke(region);
   }

   render() {
      const {
         canvas_ref, width_px, height_px, slider_refs,
         canvas_top, canvas_left, extrema
      } = this.state;
      const {inputs} = this.props;
      const handle_style = {
         border: "0.15rem solid #666666",
         borderRadius: "0.25rem",
         marginLeft: "-0.125rem",
         width: "0.25rem",
         height: "0.25rem",
         backgroundColor: "white",
         cursor: "pointer"
      };
      const span = extrema.max - extrema.min;
      const sliders = inputs.map((input, index) => {
         return <SliderWrapper
            key={`vertical_slider_${index}`}
            ref={slider_refs[index]}>
            <VerticalSlider
               vertical included
               handleStyle={handle_style}
               min={extrema.min}
               max={extrema.max}
               step={span / 100}
               onChange={value => this.set_slider_value(index, value)}
               value={input}
            />
         </SliderWrapper>
      })
      const field_styles = {
         width: `${width_px}px`,
         height: `${height_px}px`,
         top: `${canvas_top + 10}px`,
         left: `${canvas_left + 2}px`,
      }
      return <BlockWrapper>
         <CanvasField
            ref={canvas_ref}
            style={field_styles}
            width={`${width_px}px`}
            height={`${height_px}px`}/>
         <TestFieldWrapper>
            {sliders}
         </TestFieldWrapper>
      </BlockWrapper>;
   }
}

export default PolyCurveEditor;
