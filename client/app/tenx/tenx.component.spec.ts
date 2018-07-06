import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TenxComponent} from './tenx.component';

describe('TenxComponent', () => {
    let component: TenxComponent;
    let fixture: ComponentFixture<TenxComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TenxComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TenxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
