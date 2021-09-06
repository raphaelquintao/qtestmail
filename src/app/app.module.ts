import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Routes, RouterModule} from '@angular/router';
import {AppComponent} from './app.component';


const routes: Routes = [
    {
        path: ':oid',
        component: AppComponent,
    }
];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        RouterModule.forRoot(routes),
        BrowserModule
    ],
    exports: [RouterModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
