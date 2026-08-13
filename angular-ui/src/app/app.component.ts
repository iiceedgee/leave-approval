import { Component, Injector } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public static InjectorInstance: Readonly<Injector>;

  constructor(private injector: Injector) {
    AppComponent.InjectorInstance = injector;
  }
}
