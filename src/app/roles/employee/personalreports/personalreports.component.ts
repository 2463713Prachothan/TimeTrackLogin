import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-reports', // This MUST match the tag in your HTML
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalreports.component.html',
  styleUrls: ['./personalreports.component.css']
})
export class PersonalreportsComponent { } // Note the capitalized 'P'