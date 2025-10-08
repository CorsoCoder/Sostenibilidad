import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

//creamos una clase para almacenar los datos
class Registro {
    private int codigo;
    private String territorio;
    private int consumo;

    Registro(int codigo, String territorio, int consumo) {
        this.codigo = codigo;
        this.territorio = territorio;
        this.consumo = consumo;
    }

    public int getCodigo() {
        return codigo;
    }

    public String getTerritorio() {
        return territorio;
    }

    public int getConsumo() {
        return consumo;
    }
}

public class LeerCSV {
    public static void main(String[] args) {
        String rutaArchivo = "datos.csv"; 
        //aqui guardaremos los municipios del csv convertidos a objeto
        List<Registro> registros = new ArrayList<>();

        //leemos el archivo
        try (BufferedReader br = new BufferedReader(new FileReader(rutaArchivo))) {
            String linea;
            boolean primeraLinea = true; 
            //lo leemos hasta que de null
            while ((linea = br.readLine()) != null) {
                if (primeraLinea) {
                    primeraLinea = false;
                    continue;
                }
                //guardamos los datos del csv en el array de strings
                String[] columnas = linea.split(";");
                if (columnas.length > 4) {
                    try {
                        //guarda el valor de la X columna sin espacios ni alante ni atras
                        int codigo = Integer.parseInt(columnas[2].trim());
                        String territorio = columnas[3].trim();
                        int consumo = Integer.parseInt(columnas[4].trim());
                        //añade el objeto creado a la lista
                        registros.add(new Registro(codigo, territorio, consumo));
                    } catch (NumberFormatException e) {
                        System.out.println("No se pudo convertir a número: " + linea);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        //usa el get para coger el valor del objeto y lo compara con comparingInt y lo hace reversed para que sea de mayor a menor
        registros.sort(Comparator.comparingInt(Registro::getConsumo).reversed());

        //muestra el top 3 de municipios que más consumen
        System.out.println("Top 3 registros con mayor consumo:");
        for (int i = 0; i < Math.min(3, registros.size()); i++) {
            Registro r = registros.get(i);
            System.out.println(
                "Código: " + r.getCodigo() +
                ", Territorio: " + r.getTerritorio() +
                ", Consumo: " + r.getConsumo()
            );
        }
    }
}
