import {Injectable} from '@angular/core';
import * as d3 from 'd3';

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
    private arcThickness: any = 25;
    private dataset: any = {};
    private dragMsg: any;
    private msgDataArray: any;
    private msgContainer: any;


    constructor() {
    }

    /**
     * Init graph container
     * */
    public fnInit(options) {
        this.msgDataArray = [{text: 'What result do you want today?'}];
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

        this.fnCreateChatBot();
        this.fnAutoAlign();
        this.fnUpdate();
        this.fnInitMsgDragListener();
        return this;
    }

    /**
     * Create circle as drag able
     * */
    public fnInitMsgDragListener() {
        const _this = this;
        this.dragListener = d3.drag()
            .on('start', function () {
                const pos = d3.mouse(_this.svg.node());
                _this.dragMsg.select('circle').attr('cx', pos[0]).style('fill', '#fff').attr('cy', pos[1]);
                _this.dragMsg.select('text').attr('x', pos[0] - 20).style('fill', '#000').attr('y', pos[1]);
            })
            .on('drag', function (d) {
                const pos = d3.mouse(_this.svg.node());
                _this.dragMsg.select('circle').attr('cx', pos[0]).attr('cy', pos[1]);
                _this.dragMsg.select('text').attr('x', pos[0] - 20).attr('y', pos[1]);
            })
            .on('end', (d) => {
                console.log(d, 'OnDrop');
                _this.dragMsg.style('display', 'none');
            });
        this.dragMsg = this.svg.selectAll('g.drag')
            .data([{}])
            .enter()
            .append('g')
            .attr('class', 'drag')
            .style('display', 'none');
        this.dragMsg.append('circle')
            .call(this.dragListener);
        this.dragMsg.append('text');
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
            .attr('height', this.height + this.margin.top + this.margin.bottom);

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

    /**
     * Create chatbot UI
     * */
    fnCreateChatBot() {
        const _this = this;
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
                _this.msgDataArray.push({text: this.value});
                _this.fnUpdateMsgArray();
                this.value = '';
            }
        });
    }

    public fnUpdateMsgArray() {
        const _this = this;
        const msgSelection = this.msgContainer.selectAll('div.message').data(this.msgDataArray);
        const newMsg = msgSelection.enter()
            .append('xhtml:div');
        newMsg.merge(msgSelection)
            .attr('class', 'container message')
            .on('mouseover', (d) => {
                const pos = d3.mouse(_this.svg.node());
                const selection = _this.svg.selectAll('g.drag').data([d]);
                selection.style('display', 'block');
                selection
                    .select('circle')
                    .style('fill', 'transparent')
                    .attr('r', '40px')
                    .attr('cx', pos[0])
                    .attr('cy', pos[1]);
                selection
                    .select('text')
                    .style('fill', 'transparent')
                    .attr('x', pos[0] - 20)
                    .attr('y', pos[1])
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
