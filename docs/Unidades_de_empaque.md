
---

Vamos a analizar la viabilidad de implementación, de un apartado de configuración de la plataforma, que me permita configurar las unidades de empaque de cada producto dentro de la bodega BRAKE-PACK ya que esto es necesario para evitar que el scanner me haga scannear 30 veces un producto que venga por 30.

Entonces dentro de la carpeta `arc` que tiene el excel con las columnas de unidad de empaque, necesitamos entonces configurar un apartado que nos permita algo así como una configuración dentro de la macro que nos permita modificar esas unidades de empaque para que cuando se coja ese paquete que viene por 10 y me piden 3, entonces serian 30 y me tocaria darle 30 veces, con esa unidad de empaque configurada, lo que sucederia es que me va a tomar el paquete por 10 y tengo que pistolear 3 veces nada mas.

Entonces revisa eso por favor.

El archivo tiene: Referencia y UE estan en la columna B y C desde b2 y c2 para abajo son 6166 entonces puedes para no leer el archivo, seguir estos pasos.

**Plan de implementación (frontend, backend mínimo, rendimiento, `.cursorrules`):** [plan-implementacion-unidades-empaque.md](./plan-implementacion-unidades-empaque.md).

Crear la plantilla, usa habilidades UI_UX para hacer un frontend pienso yo como un listado de todas las referencias  ANALIZA PORQUE NECESITAMOS QUE ESAS 6166 no nos dañe temas de rendimiento
Entonces que debe permitir ese apartado de referencias:

1. dejarme añadir mas
2. Tener la posibilidad de cargar un archivo excel que me traiga como te digo con esos 2 nombres *Referencia* y *UE* con esos 2 y que si encuentra esos encabezados todo lo que este por dejabo en esas mismas columnas lo traiga como una referencia 
3. Que cuando este pistoleando me referencie la unidad de empaque priorizando la eficiencia por favor
4. Dejarme edita
5. Barra de busqueda para buscar una referencia en espeisifico 
