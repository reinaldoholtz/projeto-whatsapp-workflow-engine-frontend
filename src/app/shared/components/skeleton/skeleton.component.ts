import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="space-y-3">
      @for (item of rowsArray(); track $index) {
        <div class="skeleton h-10 rounded-lg w-full"></div>
      }
    </div>
  `
})
export class SkeletonComponent {
  rows = input<number>(5);

  rowsArray = computed(() => Array(this.rows()).fill(0));
}