# ReUse Campus

Plataforma web para donar o intercambiar artículos usados entre estudiantes.
Evaluación Integradora – Electivo Angular, Instituto Profesional Virginio Gómez.

## Autor
TU NOMBRE COMPLETO

## Tecnologías
- Frontend: Angular + HttpClient
- Backend: Node.js + Express
- Base de datos: Microsoft SQL Server

## Entidades
- **Usuarios**: personas que usan la plataforma (rol USUARIO o ADMINISTRADOR).
- **Publicaciones**: artículos ofrecidos por un usuario (DISPONIBLE, RESERVADA, ENTREGADA, CANCELADA).
- **Solicitudes**: pedidos de otros usuarios sobre una publicación (PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA).
- **Entregas**: se crea al aceptar una solicitud (PENDIENTE, COMPLETADA).

## Base de datos
Ejecutar el script `database/ReUseCampus.sql` en SQL Server Management Studio.
Crea la base `ReUseCampus`, las 4 tablas con sus llaves foráneas y datos de ejemplo.

*(Este README se completa en los pasos siguientes.)*