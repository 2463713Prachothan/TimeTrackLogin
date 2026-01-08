import { ComponentFixture, TestBed } from '@angular/core/testing';

import {tasksassignedComponent} from './tasksassigned.component';

describe('TasksassignedComponent', () => {
  let component: tasksassignedComponent;
  let fixture: ComponentFixture<tasksassignedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [tasksassignedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(tasksassignedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
