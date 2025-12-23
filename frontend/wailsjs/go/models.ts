export namespace academic {
	
	export class AnioLectivo {
	    ID: number;
	    Nombre: string;
	    FechaInicio: time.Time;
	    FechaFin: time.Time;
	    Activo: boolean;
	    Cerrado: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AnioLectivo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Nombre = source["Nombre"];
	        this.FechaInicio = this.convertValues(source["FechaInicio"], time.Time);
	        this.FechaFin = this.convertValues(source["FechaFin"], time.Time);
	        this.Activo = source["Activo"];
	        this.Cerrado = source["Cerrado"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace services {
	
	export class LoginResponse {
	    nombres_completos: string;
	    rol: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombres_completos = source["nombres_completos"];
	        this.rol = source["rol"];
	    }
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

