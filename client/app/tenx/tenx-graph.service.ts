import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Injectable()
export class TenxGraphService {

    private parentEle: any;
    private svg: any;
    private svgG: any;
    private zoomG: any;
    private chatbot: any;
    private chatbotG: any;
    private chatbotH: any = 140;
    private chatbotW: any = 350;
    private zoomParameter: any;
    private zoomListener: any;
    private dragListener: any;
    private height: any;
    private width: any;
    private margin: any = {top: 20, right: 20, bottom: 20, left: 20};
    private color: any = d3.scaleOrdinal(d3.schemeCategory10);
    private pie: any = d3.pie().value((d: any) => {
        return 1;
    }).sort(null);
    private arc: any = d3.arc();
    private arcThickness: any = 0;
    private dataset: any = {};
    private dragMsg: any;
    private msgDataArray: any;
    private msgContainer: any;
    private zoomGhostG: any;
    private svgZoomG: any;
    private dragTarget: any;
    private circleColorScale: any;

    constructor() {
    }

    /**
     * Init graph container
     * */
    public fnInit(options) {
        this.msgDataArray = [{text: 'What result do you want today?'}];
        this.parentEle = options.parentEle;
        this.dataset = options.data;
        this.circleColorScale = d3.scaleLinear<string>().domain([1, 10]).range(['#47aaff', '#274864']);
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
            this.zoomGhostG.attr('transform', d3.event.transform);
        });

        this.fnCreateChatBot();
        this.fnInitMsgDragListener();
        this.zoomGhostG = this.svg.append('g');
        this.svgZoomG = this.zoomGhostG.append('g')
            .attr('transform', 'translate(' + this.parentEle.clientWidth / 2 + ',' + this.parentEle.clientHeight / 2 + ')');
        this.fnAutoAlign();
        this.fnUpdate();
        this.dragTarget = null;
        return this;
    }

    // Gaussian eq to get points due to various node size
    public calculatePoint(d) {
        const diffX = d.target.x - d.source.x;
        const diffY = d.target.y - d.source.y;

        const pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));

        const offsetX = (diffX * (d.value)) / pathLength;
        const offsetY = (diffY * (d.value)) / pathLength;

        return [d.target.x - offsetX, d.target.y - offsetY];
    }

    /**
     * Create circle as drag able
     * */
    public fnInitMsgDragListener() {
        const self = this;
        this.dragListener = d3.drag()
            .on('start', function () {
                d3.event.sourceEvent.stopPropagation();
                self.dragMsg.select('circle').style('fill', '#fff');
                self.dragMsg.select('text').style('fill', '#000');
                self.svgZoomG.selectAll('.ghost-g').attr('pointer-events', 'mouseover');
                self.svgZoomG.selectAll('.ghost-path').attr('pointer-events', 'mouseover');
                d3.event.sourceEvent.preventDefault();
            })
            .on('drag', function (d: any) {
                const pos = d3.mouse(self.svg.node());
                const posTarget = d3.mouse(self.svgG.node());
                if (self.dragTarget) {
                    const value = self.calculatePoint({
                        target: {
                            x: 0,
                            y: 0
                        },
                        source: {
                            x: posTarget[0],
                            y: posTarget[1]
                        },
                        value: (((((self.arcThickness * (self.dragTarget.parentIndex))) -
                            (self.arcThickness * (self.dragTarget.parentIndex - 1))) / 2) +
                            (self.arcThickness * (self.dragTarget.parentIndex - 1)))
                    });
                    const transform = self.svgG.attr('transform').split('translate(')[1].split(')')
                        [0].split(',');
                    self.dragMsg.attr('transform', 'translate(' + (parseFloat(transform[0]) + value[0]) + ','
                        + (parseFloat(transform[1]) + value[1]) + ')');
                } else {
                    self.dragMsg.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ')');
                }
            })
            .on('end', (d: any) => {
                const posTarget = d3.mouse(self.svgG.node());
                if (self.dragTarget) {
                    const value = self.calculatePoint({
                        target: {
                            x: 0,
                            y: 0
                        },
                        source: {
                            x: posTarget[0],
                            y: posTarget[1]
                        },
                        value: (((((self.arcThickness * (self.dragTarget.parentIndex))) -
                            (self.arcThickness * (self.dragTarget.parentIndex - 1))) / 2) +
                            (self.arcThickness * (self.dragTarget.parentIndex - 1)))
                    });
                    d.cx = value[0];
                    d.cy = value[1];
                    self.dragTarget.partitionObj.data.children.push(_.cloneDeep(d));
                }
                self.dragMsg.select('circle').style('fill', 'transparent');
                self.dragMsg.select('text').style('fill', 'transparent');
                self.svgZoomG.selectAll('.ghost-g').attr('pointer-events', 'none');
                self.svgZoomG.selectAll('.ghost-path').attr('pointer-events', 'none');
                self.dragMsg.attr('transform', 'translate(-1000, -1000)');
                self.fnUpdate();
                self.dragTarget = null;
            });
        this.dragMsg = this.svg.selectAll('g.drag')
            .data([{}])
            .enter()
            .append('g')
            .attr('class', 'drag').call(this.dragListener);
        this.dragMsg.append('circle');
        this.dragMsg.append('text')
            .attr('x', (-self.arcThickness / 2) + 5)
            .style('text-anchor', 'center')
            .style('font-size', '12px')
            .style('dominant-baseline', 'middle');
    }

    /**
     * Update graph alignment on resize
     * */
    public fnAutoAlign() {
        // Set the dimensions and margins of the diagram
        this.width = this.parentEle.clientWidth - this.margin.left - this.margin.right;
        this.height = this.parentEle.clientHeight - this.margin.top - this.margin.bottom;
        this.arcThickness = (((this.height - this.chatbotH) < this.width ? (this.height - this.chatbotH) : this.width)) / ((10 * 2) + 1);
        // moves the 'group' element to the top left margin
        this.svg.attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);
        this.svgG.attr('transform', 'translate(' + this.parentEle.clientWidth / 2 + ',' + (((this.parentEle.clientHeight - (this.chatbotH + 25)) / 2)) + ')');
        this.svgZoomG.attr('transform', 'translate(' + this.parentEle.clientWidth / 2 + ',' + (((this.parentEle.clientHeight - (this.chatbotH + 25)) / 2)) + ')');
        const chatBotX = ((this.width / 2) + this.margin.left) - (this.chatbotW / 2);
        const chatBotY = this.height - this.chatbotH;
        this.chatbotG.attr('transform', 'translate(' + chatBotX + ',' + chatBotY + ')');
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
        const self = this;
        const gsSelection = this.svgG.selectAll('g.parentG')
            .data(this.dataset);
        const newGEle = gsSelection.enter()
            .append('g')
            .attr('class', (d, i) => {
                return 'parentG level' + (i + 1);
            });
        const gSelection = newGEle.merge(gsSelection).selectAll('g.path-g')
            .data((d, i) => {
                return self.pie(d.data).map((item) => {
                    return {partitionObj: item, parentIndex: i + 1};
                });
            });
        const newG = gSelection.enter().append('g').attr('class', 'path-g');
        gSelection.exit().remove();
        const pathSelection = newG.merge(gSelection).selectAll('path').data((d) => {
            return [d];
        });
        const newPath = pathSelection.enter().append('path');

        newPath.merge(pathSelection)
            .attr('class', (d) => {
                return 'node' + d.parentIndex;
            })
            .attr('stroke', (d) => {
                return '#fff';
            })
            .attr('fill', (d) => {
                return this.circleColorScale(d.parentIndex);
            })
            .style('opacity', 1)
            .attr('pointer-events', 'mouseover')
            .on('click', (e) => {
                console.log('click', e, d3.event);
            })
            .transition()
            .duration(750)
            .attr('d', (d) => {
                return self.arc
                    .innerRadius(self.arcThickness * (d.parentIndex - 1))
                    .outerRadius(self.arcThickness * (d.parentIndex))(d.partitionObj);
            });
        const childGSelection = this.svgG.selectAll('g.childG')
            .data(this.dataset);
        const newChildGEle = childGSelection.enter()
            .append('g')
            .attr('class', (d, i) => {
                return 'childG level' + (i + 1);
            });
        const pgSelection = newChildGEle.merge(childGSelection).selectAll('g.path-g')
            .data((d, i) => {
                return self.pie(d.data).map((item) => {
                    return {partitionObj: item, parentIndex: i + 1};
                });
            });
        const newPG = pgSelection.enter().append('g').attr('class', 'path-g');
        pgSelection.exit().remove();
        const childPGSelection = newPG.merge(pgSelection).selectAll('g.child-g')
            .data((d, i) => {
                return d.partitionObj.data.children;
            });
        const newChildG = childPGSelection.enter().append('g');

        newChildG.merge(childPGSelection)
            .attr('class', (d) => {
                return 'child-g';
            })
            .attr('transform', (d) => {
                return 'translate(' + d.cx + ',' + d.cy + ')';
            });
        childGSelection.exit().remove();
        const childSelection = newChildG.merge(childGSelection).selectAll('circle').data((d) => {
            return [d];
        });
        const newChild = childSelection.enter().append('circle');
        newChild.merge(childSelection)
            .attr('r', (c) => {
                return self.arcThickness / 2;
            })
            .attr('fill', 'white')
            .attr('cx', 0)
            .attr('cy', 0);
        pathSelection.exit().remove();
        gsSelection.exit().remove();

        /*---- ghost pie chart implementation---*/
        const gsZoomSelection = this.svgZoomG.selectAll('g')
            .data(this.dataset);
        const newZoomGEle = gsZoomSelection.enter()
            .append('g')
            .attr('class', 'ghost-g')
            .attr('pointer-events', 'none');

        const pathZoomSelection = newZoomGEle.merge(gsZoomSelection).selectAll('path')
            .data((d, i) => {
                return self.pie(d.data).map((item) => {
                    return {partitionObj: item, parentIndex: i + 1};
                });
            });

        const newZoomPath = pathZoomSelection.enter().append('path');

        newZoomPath.merge(pathZoomSelection)
            .attr('class', 'ghost-path')
            .attr('pointer-events', 'none')
            .attr('d', (d) => {
                return self.arc
                    .innerRadius(self.arcThickness * (d.parentIndex - 1))
                    .outerRadius(self.arcThickness * (d.parentIndex))(d.partitionObj);
            })
            .style('fill', 'transparent')
            .on('mouseover', function (d) {
                d3.selectAll('.node' + d.parentIndex)
                    .attr('stroke', (g: any) => {
                        return '#fff';
                    })
                    .attr('fill', (g: any) => {
                        return self.circleColorScale(g.parentIndex);
                    })
                    .style('opacity', 0.8)
                    .each((c: any) => {
                        if (c.partitionObj.index === d.partitionObj.index) {
                            self.dragTarget = c;
                        }
                    });
            })
            .on('mouseleave', function (d) {
                d3.selectAll('.node' + d.parentIndex)
                    .attr('stroke', (g: any) => {
                        return '#fff';
                    })
                    .attr('fill', (g: any) => {
                        return self.circleColorScale(g.parentIndex);
                    })
                    .style('opacity', 1).each((c) => {
                    self.dragTarget = null;
                });
            });
        pathZoomSelection.exit().remove();
        gsZoomSelection.exit().remove();
        /*---- ghost pie chart implementation---*/
    }

    /**
     * Create chatbot UI
     * */
    fnCreateChatBot() {
        const self = this;
        this.chatbotG = this.svg.append('g');

        this.chatbot = this.chatbotG.append('foreignObject')
            .attr('width', this.chatbotW)
            .attr('height', this.chatbotH)
            .append('xhtml:div')
            .attr('class', 'chatbot');
        this.msgContainer = this.chatbot.append('xhtml:div')
            .attr('class', 'msg-container');
        this.fnUpdateMsgArray();
        // Add TextBox
        this.chatbot.append('xhtml:div')
            .attr('class', 'container')
            .append('xhtml:input')
            .attr('type', 'text')
            .attr('class', 'form-control').on('keypress', function () {
            if (d3.event.keyCode === 13) {
                self.msgDataArray.push({text: this.value});
                self.fnUpdateMsgArray();
                this.value = '';
            }
        });
    }

    public fnUpdateMsgArray() {
        const self = this;
        const msgSelection = this.msgContainer.selectAll('div.message').data(this.msgDataArray);
        const newMsg = msgSelection.enter()
            .append('xhtml:div');
        newMsg.merge(msgSelection)
            .attr('class', 'container message')
            .on('mouseover', (d) => {
                const pos = d3.mouse(self.svg.node());
                const selection = self.svg.selectAll('g.drag').data([d]);
                // selection.style('display', 'block');
                selection.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ')');
                selection
                    .select('circle')
                    .style('fill', 'transparent')
                    .attr('r', self.arcThickness / 2)
                ;
                selection
                    .select('text')
                    .style('fill', 'transparent')
                    .text((td) => {
                        if (td.text.length > 5) {
                            return td.text.substring(0, 5) + '...';
                        } else {
                            return td.text;
                        }
                    });
            });
        msgSelection.exit().remove();
        const imgSelection = newMsg.merge(msgSelection)
            .selectAll('img.avatar')
            .data((d) => {
                return [d];
            });

        const newImg = imgSelection.enter().append('xhtml:img');
        newImg.merge(imgSelection)
            .attr('class', 'avatar')
            .attr('src', 'http://via.placeholder.com/150x150?text=USER')
            .attr('alt', 'Avatar');
        imgSelection.exit().remove();
        const pSelection = newMsg.merge(msgSelection)
            .selectAll('p.content')
            .data((d) => {
                return [d];
            });
        const newP = pSelection.enter().append('xhtml:p');
        newP.merge(pSelection)
            .attr('class', 'content')
            .text((d) => {
                return d.text;
            });
        pSelection.exit().remove();
        this.msgContainer.each(() => {
            const msgEle = document.getElementsByClassName('msg-container')[0];
            msgEle.scrollTo(0, msgEle.scrollHeight);
        });
    }

}
