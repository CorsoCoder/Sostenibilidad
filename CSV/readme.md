

## 🧾 Proyecto: Lectura y análisis CSV.

### 🎯 Objetivo del programa

Este programa tiene como finalidad **leer un archivo CSV** que contiene datos de consumo energético por territorio, **convertir cada línea en un objeto Java** y finalmente **mostrar los tres registros con mayor consumo**.

---

### ⚙️ Funcionamiento general

1. **Clase `Registro`**

   * Es una clase que representa una fila del CSV.
   * Guarda tres atributos:

     * `codigo`: identificador numérico.
     * `territorio`: nombre del municipio o región.
     * `consumo`: valor numérico del consumo.
   * Incluye getters para poder acceder a sus datos.

```java
class Registro {
    private int codigo;
    private String territorio;
    private int consumo;

    Registro(int codigo, String territorio, int consumo) {
        this.codigo = codigo;
        this.territorio = territorio;
        this.consumo = consumo;
    }
...getters and setters....
```
2. **Lectura del archivo CSV (`LeerCSV`)**

   * Se define la ruta del archivo en la variable `rutaArchivo`.
   * Se usa un `BufferedReader` para leer el archivo línea a línea.
     ```java
        try (BufferedReader br = new BufferedReader(new FileReader(rutaArchivo))) {
     ```
      * **`BufferedReader br`** → crea un lector de texto con búfer para leer líneas eficientemente.
      * **`new FileReader(rutaArchivo)`** → abre el archivo indicado por la ruta.

   * Se salta la **primera línea** porque contiene los encabezados.
   * Cada línea se divide en columnas usando el separador `;`.
   * Se extraen los campos relevantes y se eliminan espacios sobrantes con `.trim()`.
   * Los valores numéricos se convierten con `Integer.parseInt`.
   * Si la conversión falla, se muestra un mensaje de error, pero el programa continúa.

3. **Creación de objetos y almacenamiento**

   * Cada línea válida se convierte en un objeto `Registro`.
   * Estos objetos se almacenan en una lista `ArrayList<Registro>`.

4. **Ordenación y selección del top 3**

   * Se ordena la lista de mayor a menor consumo usando:
     `Comparator.comparingInt(Registro::getConsumo).reversed()`

     * **`registros.sort(...)`** → ordena la lista `registros` según el criterio que se le pase.
     * **`Comparator.comparingInt(Registro::getConsumo)`** → crea un comparador basado en el valor entero devuelto por `getConsumo()`.
     * **`.reversed()`** → invierte el orden, dejando los mayores consumos primero.
   * Se muestran los **tres registros con mayor consumo** en consola.

---

### 📊 Ejemplo de salida

```
Top 3 registros con mayor consumo:
Código: 102, Territorio: Valencia, Consumo: 5200
Código: 305, Territorio: Madrid, Consumo: 4900
Código: 410, Territorio: Sevilla, Consumo: 4600
```
