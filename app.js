const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndSever = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndSever();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// Get Todos API

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
              SELECT
                 * 
              FROM 
                 todo
              WHERE
                 todo LIKE '%${search_q}%'
                 AND status = '${status}'
                 AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
              SELECT
                 * 
              FROM 
                 todo
              WHERE
                 todo LIKE '%${search_q}%'
                 AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
              SELECT
                 * 
              FROM 
                 todo
              WHERE
                 todo LIKE '%${search_q}%'
                 AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
              SELECT
                 * 
              FROM 
                 todo
              WHERE
                 todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

// Get Todo With TodoID API

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
        SELECT
           *
        FROM
           todo
        WHERE
           id = ${todoId};`;
  const todo = await db.get(getTodo);
  response.send(todo);
});

// Post Todo API

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postTodoQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// Update Todo API

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const getTodoQuery = `
      SELECT
         *
      FROM 
         todo
      WHERE
         id = ${todoId};`;
  const previousTodo = await db.get(getTodoQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = requestBody;
  const updateTodoQuery = `
                UPDATE 
                   todo
                SET
                   status = '${status}',
                   priority = '${priority}',
                   todo = '${todo}'
                WHERE id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// Delete Todo API

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
           todo
        WHERE
           id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
