import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qcm-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qcm-form.component.html',
  styleUrls: ['./qcm-form.component.css']
})
export class QcmFormComponent {
  questions = [
    {
      id: 1,
      text: 'Exemple de question ?',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' }
      ]
    },
    // Ajoutez d'autres questions ici
  ];

  answers: { [key: string]: string } = {};
  formSubmitted = false;

  onSubmit() {
    this.formSubmitted = true;
    console.log('Réponses:', this.answers);
  }
}
