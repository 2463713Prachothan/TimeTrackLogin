import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";


@Component({
  selector: "app-features",
  imports: [CommonModule],
  templateUrl: "./features.component.html",
  styleUrl: "./features.component.css",
})
export class FeaturesComponent {
    hoveredIndex: number | null = null;

  features = [
    { title: 'Smart Time Tracking', desc: 'Effortlessly log work hours with our intuitive system. Automatic break calculations and overtime alerts.', icon: '🕒' },
    { title: 'Team Management', desc: 'Manage your entire workforce from a centralized dashboard. Assign tasks and optimize performance.', icon: '👥' },
    { title: 'Productivity Analytics', desc: 'Gain deep insights with comprehensive analytics and reporting. Identify trends and improve efficiency.', icon: '📊' },
    { title: 'Secure & Compliant', desc: 'Enterprise-grade security with role-based access control. Keep your data safe and compliant.', icon: '🔒' },
    { title: 'Real-time Reports', desc: 'Generate detailed reports instantly. Track productivity, attendance, and progress in real-time.', icon: '📄' },
    { title: 'Task Integration', desc: 'Seamlessly integrate time logs with tasks. Track time spent on each project and measure efficiency.', icon: '🛠️' }
  ];

  setHover(index: number | null) {
    this.hoveredIndex = index;
  }
}