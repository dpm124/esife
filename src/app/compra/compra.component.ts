import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-compra',
  imports: [],
  templateUrl: './compra.html',
  styleUrl: './compra.css',
})
export class CompraComponent implements OnInit {

  idEspectaculo: string | null = null;
  artista: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.idEspectaculo = params['idEspectaculo'];
      this.artista = params['artista'];
      console.log('ID del espectáculo:', this.idEspectaculo);
      console.log('Artista:', this.artista);
    });
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}