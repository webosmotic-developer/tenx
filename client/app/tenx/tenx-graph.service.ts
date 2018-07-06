import {Injectable} from '@angular/core';
import * as d3 from 'd3';

@Injectable()
export class TenxGraphService {

    private parentEle: any;
    private svg: any;
    private svgG: any;
    private zoomG: any;
    private zoomParameter: any;
    private zoomListener: any;
    private height: any;
    private width: any;
    private margin: any = {top: 20, right: 20, bottom: 20, left: 20};
    private color: any = d3.scaleOrdinal(d3.schemeCategory10);
    private pie: any = d3.pie().value((d: any) => {
        return 1;
    }).sort(null);
    private arc: any = d3.arc();
    private arcThickness: any = 25;
    private dataset: any = {};


    constructor() {
    }

    /**
     * Init graph container
     * */
    public fnInit(options) {
        this.parentEle = options.parentEle;
        this.dataset = options.data;

        d3.select(this.parentEle).select('svg').remove();
        // append the svg object to the body of the page
        this.svg = d3.select(this.parentEle).append('svg').attr('class', 'tree-layout');
        this.zoomG = this.svg.append('g');
        // appends a 'group' element to 'svg'
        this.svgG = this.zoomG.append('g')
            .attr('transform', 'translate(' + this.parentEle.clientWidth / 2 + ',' + this.parentEle.clientHeight / 2 + ')');

        this.zoomListener = d3.zoom().on('zoom', () => {
            this.zoomParameter = d3.event.transform;
            this.zoomG.attr('transform', d3.event.transform);
        });

        this.fnAutoAlign();
        this.fnUpdate();
        return this;
    }

    /**
     * Update graph alignment on resize
     * */
    public fnAutoAlign() {
        // Set the dimensions and margins of the diagram
        this.width = this.parentEle.clientWidth - this.margin.left - this.margin.right;
        this.height = this.parentEle.clientHeight - this.margin.top - this.margin.bottom;
        // moves the 'group' element to the top left margin
        this.svg.attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .call(this.zoomListener);
    }

    /**
     * Resize the graph
     * */
    public fnResize() {
        this.fnAutoAlign();
        this.fnUpdate();
    }

    /**
     * Update Graph data
     * */
    public fnUpdate() {
        const _this = this;
        const gsSelection = this.svgG.selectAll('g')
            .data(this.dataset);

        const newGEle = gsSelection.enter()
            .append('g')
            .attr('class', (d, i) => {
                return 'level' + (i + 1);
            });

        const pathSelection = newGEle.merge(gsSelection).selectAll('path')
            .data((d, i) => {
                return _this.pie(d.data).map((item) => {
                    return {partitionObj: item, parentIndex: i + 1};
                });
            });

        const newPath = pathSelection.enter().append('path');

        newPath.merge(pathSelection)
            .attr('stroke', '#fff')
            .attr('fill', (d) => {
                return _this.color(d.parentIndex);
            })
            .attr('d', (d) => {
                return _this.arc
                    .innerRadius(_this.arcThickness * (d.parentIndex - 1))
                    .outerRadius(_this.arcThickness * (d.parentIndex))(d.partitionObj);
            })
            .on('mouseover', (e) => {
                console.log(e, d3.event);
            });
        pathSelection.exit().remove();
        gsSelection.exit().remove();
    }

}
