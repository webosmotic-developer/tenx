import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {TenxGraphService} from './tenx/tenx-graph.service';

import {AppComponent} from './app.component';
import {TenxComponent} from './tenx/tenx.component';


@NgModule({
    declarations: [
        AppComponent,
        TenxComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [
        TenxGraphService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
