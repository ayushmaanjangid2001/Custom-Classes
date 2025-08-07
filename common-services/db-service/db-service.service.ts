import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';


@Injectable({
  providedIn: 'root'
})
export class DbService {

  private db!: SQLiteObject

  constructor(
    private sqlite: SQLite,
  ) { }

  private executeQuery<T>(
    query: string,
    functionName: any,
    params: any[] = [],
    processResult?: (res: any) => T
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          query,
          params,
          (_tx: any, res: any) => {
            try {
              if (processResult) {
                resolve(processResult(res));
              } else {
                resolve(res);
              }
            } catch (err) {
              reject(functionName + " - processResult: " + JSON.stringify(err));
            }
          },
          (_tx: any, err: any) => {
            reject(functionName + " - executeQuery: " + JSON.stringify(err));
          }
        );
      });
    });
  }

  /**
   * Call this function when you wan to init the database or alter the database table
   * User can povide the database name, table user want to create and an array of alter table 
   * to alter the database 
   * 
   * @param name DB Table Name
   * @param initTables Table to be created
   * @param alterTable Alter Table commands
   */
  async initDb(name: string, initTables: any[], alterTable: any[]) {
    const SELECT_MAX_FROM_MIGRATIONS = "SELECT MAX(Id) as Max FROM Migrations"
    this.db = await this.sqlite.create({
      name: name,
      location: "default",
      androidDatabaseLocation: 'system'
    })
    for (const table of initTables) {
      await this.createTables(table.schema);
    }
    const alterTableSize = alterTable.length;
    let max = await this.selectMaxFromMigrations(SELECT_MAX_FROM_MIGRATIONS)
    if (max == null) {
      max = 0;
      const pendingQueries = alterTable.slice(max, alterTableSize);
      for (let i = 0; i < pendingQueries.length; i++) {
        const query: any = pendingQueries[i];
        const isExists = await this.checkColumnExists(query);
        if (typeof query == 'string' && query.trim().length > 0 && !isExists) {
          await this.alterTable(query);
        }
      }
      await this.executeQuery<any>(
        "INSERT INTO Migrations (Id) VALUES (?)",
        "insertIntoMigrations",
        [alterTableSize],
        () => ({})
      )
    }
    else if (max < alterTableSize) {
      const pendingQueries = alterTable.slice(max, alterTableSize);
      for (let i = 0; i < pendingQueries.length; i++) {
        const query: any = pendingQueries[i];
        const isExists = await this.checkColumnExists(query);
        if (typeof query == 'string' && query.trim().length > 0 && !isExists) {
          await this.alterTable(query);
        }
      }
      await this.updateMigrations(alterTableSize, max);
    }
    const version = 1;
    let count = await this.executeQuery<any>(
      "SELECT COUNT(*) AS count FROM `App_Version` WHERE Version = ?",
      "getAppVersion",
      [version],
      (res) => {
        return res.rows.item(0).count
      }
    )
    if (count == 0) {
      await this.executeQuery<any>(
        "INSERT INTO `App_Version` (Version) VALUES (?)",
        "insertAppVersion",
        [version],
        () => ({})
      )
    }
  }

  private updateMigrations(newId: any, oldId: any) {
    return this.executeQuery<any>(
      "UPDATE Migrations SET Id = ? WHERE Id = ?",
      "updateMigrations",
      [
        newId,
        oldId
      ],
      () => ({})
    )
  }

  private async createTables(tableSchema: string) {
    return this.executeQuery<any>(
      tableSchema,
      "createTables",
      [],
      () => ({})
    )
  }

  private selectMaxFromMigrations(query: string) {
    return this.executeQuery<any>(
      query,
      "selectMaxFromMigrations",
      [],
      (res) => {
        return res.rows.item(0).Max;
      }
    )
  }

  private async checkColumnExists(query: string) {
    const { table, column } = this.extractTableAndColumnFromAlterQuery(query);
    if (!table) {
      return false;
    }
    const QUERY = `PRAGMA table_info(${table})`;
    const columns = await this.pragmaTableInfo(QUERY);
    return columns.some((col: any) => col.name == column);
  }

  private extractTableAndColumnFromAlterQuery(query: string): { table: string | null, column: string | null } {
    const regex = /ALTER\s+TABLE\s+[`"]?(\w+)[`"]?\s+ADD\s+COLUMN\s+[`"]?(\w+)[`"]?/i;
    const match = query.match(regex);
    if (match) {
      return {
        table: match[1],
        column: match[2],
      };
    }
    return {
      table: null,
      column: null,
    };
  }

  private pragmaTableInfo(query: string) {
    return this.executeQuery<any>(
      query,
      "pragmaTableInfo",
      [],
      (res) => {
        let cols: any[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          cols.push(res.rows.item(i));
        }
        return cols;
      }
    )
  }

  private alterTable(query: string) {
    return this.executeQuery<any>(
      query,
      "alterTable",
      [],
      () => ({})
    )
  }

  /**
   * Select Function that Selects the data from the table based on some parameters
   * 
   * @param query SQL Query
   * @param params Parameters
   * @param functionName Function Which is callin this
   * @returns Sql Data based on query (Array Type)
   */
  selectSqlQueryWithParams(query: string, params: any[], functionName: string) {
    return this.executeQuery<any>(
      query,
      functionName,
      params,
      (res) => {
        let result: any[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          result.push(res.rows.item(i));
        }
        return result;
      }
    )
  }

  /**
   * Select Function that Selects the data from the table
   * 
   * @param query SQL Query
   * @param functionName Function Which is calling this
   * @returns Sql Data based on query (Array Type)
   */
  selectSqlQueryWOParams(query: string, functionName: string) {
    return this.executeQuery<any>(
      query,
      functionName,
      [],
      (res) => {
        let result: any[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          result.push(res.rows.item(i));
        }
        return result;
      }
    )
  }

  /**
   * Insert Function that inserts the data into database and returns the insert id
   * 
   * @param query SQL Query
   * @param params Parameters
   * @param functionName Function Which is calling this
   * @returns insert id
   */
  insertSqlQueryWithInsertId(query: string, params: any[], functionName: string) {
    return this.executeQuery<any>(
      query,
      functionName,
      params,
      (res) => { return res.insertId }
    )
  }

  /**
   * Insert Function that inserts the data into database without insert id;
   * 
   * @param query SQL Query
   * @param params Parameters
   * @param functionName Function Which is calling this
   */
  insertSqlQueryWOInsertId(query: string, params: any[], functionName: string) {
    return this.executeQuery<any>(
      query,
      functionName,
      params,
      () => ({})
    )
  }

  /**
   * Update Function that updates row data.
   * 
   * @param query SQL Query
   * @param params Parameters
   * @param functionName Function Which is calling this
   */
  updateSqlQuery(query: string, params: any[], functionName: string) {
    return this.executeQuery<any>(
      query,
      functionName,
      params,
      () => ({})
    )
  }

  /**
   * Delet Function that Delete row data.
   * 
   * @param query SQL Query
   * @param params Parameters
   * @param functionName Function Which is calling this
   */
  deleteSqlQuery(query: string, params: any[], functionName: string) {
    return this.executeQuery<any>(
      query,
      functionName,
      params,
      () => ({})
    )
  }

  /**
   * When User Want to insert data in bulk use this function. 
   * Provide Placeholders like this (?,?,?).. also the total placeholder value should
   * be value to be insert. If there are 3 values to to insert then there should be 
   * 3 placeholders. 
   * Also Push each row's values in the order of the object's keys
   * Assumes row is an object like {name: 'John', age: 30, city: 'NY'})
   * then in insert query it should be INSERT INTO TABLE_NAME (name,age,city) VALUES.
   * Also in the static query do not add placeholders it should be till VALUES
   * 
   * @param query SQL Query
   * @param dataList Data To be inserted
   * @param placeholders Provide Placeholders like (?,?,?)...
   * @param functionName Function Which is calling this
   */
  async bulkInsertData(query: any, dataList: any[], placeholders: string, functionName: string) {
    if (!dataList.length) return;

    const chunkSize = 999;
    const totalChunks = Math.ceil(dataList.length / chunkSize);

    const insertPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = dataList.slice(i * chunkSize, (i + 1) * chunkSize);
      insertPromises.push(this.insertChunk(query, chunk, placeholders, functionName));
    }
    await Promise.all(insertPromises);
  }

  private insertChunk(query: any, rows: any, placeholders: string, functionName: string) {
    let valuesArray: any[] = [];
    let placeholderTemplate: string[] = [];
    rows.forEach((row: any) => {
      placeholderTemplate.push(placeholders)
      valuesArray.push(...Object.values(row));
    })
    const finalQuery = query.trim().endsWith("VALUES")
      ? query + " " + placeholderTemplate.join(", ")
      : query + " VALUES " + placeholderTemplate.join(", ");

    return this.executeQuery<void>(
      finalQuery,
      "insertMutlipleChunks()" + `->${functionName}`,
      valuesArray,
      () => { }
    );
  }
}
