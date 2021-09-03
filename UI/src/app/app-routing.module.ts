import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './_components/home/home.component';
import { AboutComponent } from './_components/about/about.component';
import { AnalyzeComponent } from './_components/analyze/analyze.component';
import { SettingsComponent } from './_components/settings/settings.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'analyze', component: AnalyzeComponent },
  { path: 'settings', component: SettingsComponent },
  //
  { path: "**", redirectTo: "/analyze", pathMatch: "full" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
