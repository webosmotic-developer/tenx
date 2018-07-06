import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';

import {TenxGraphService} from './tenx-graph.service';

@Component({
    selector: 'app-tenx',
    templateUrl: './tenx.component.html',
    styleUrls: ['./tenx.component.css']
})
export class TenxComponent implements OnInit, AfterViewInit {
    @ViewChild('svgContainer') public parentEle: ElementRef;
    tenxService: any;

    constructor(private tenxGraphService: TenxGraphService) {
    }

    @HostListener('window:resize')
    public onResize() {
        // guard against resize before view is rendered
        if (this.tenxService) {
            setTimeout(() => {
                this.tenxService.fnResize();
            }, 250);
        }
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        const options: any = {parentEle: this.parentEle.nativeElement};
        options.data = this.fnCreateData();
        this.tenxService = this.tenxGraphService.fnInit(options);
    }

    /**
     * Generate dummy data for creating graph
     * */
    fnCreateData() {
        const categories = ['Work', 'Fun', 'Health', 'Relationship'];
        const data = [];
        for (let intIndex = 0; intIndex < 10; intIndex++) {
            const obj = {levelIndex: intIndex, data: []};
            _.forEach(categories, (category) => {
                obj.data.push({name: category, children: []});
            });
            data.push(obj);
        }
        return data;
    }

}
