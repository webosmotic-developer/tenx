import {TestBed, inject} from '@angular/core/testing';

import {TenxGraphService} from './tenx-graph.service';

describe('TenxGraphService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TenxGraphService]
        });
    });

    it('should be created', inject([TenxGraphService], (service: TenxGraphService) => {
        expect(service).toBeTruthy();
    }));
});
