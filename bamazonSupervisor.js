//use mysql to interact with the mysql database i've created
var mysql = require("mysql");
//use inquirer to prompt for input and give output
var inquirer = require("inquirer");
//let's make pretty tables
const {table} = require('table');

//create a connection to the database
var connection = mysql.createConnection(
{//connection details
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "password1",
  database: "bamazonDB"
});

//connect and throw an error if there is one
connection.connect(function(err) 
{
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  showMenu();//list the manager menu options
});

function viewProducts() 
{//showing all products for sale
  console.log("Selecting all products...\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    res.forEach(printItem);
    showMenu();
  });
}

function addMoreInventory(item,quantity)
{
  console.log("Adding  " + quantity + " x Item ID: " + item);
  connection.query(
    "UPDATE products SET stock = stock + ? WHERE ?",
    [
      quantity,
      {
        item_id: item
      }
    ],
    function(err, res) 
    {
      showMenu();
    }
  );
}


function checkStock(item,quantity)
{
  var myQuantity = 0;
  connection.query("SELECT * FROM products WHERE item_id = ?",item, function(err, res) 
  {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    //console.log(res[0]);
    //console.log(parseInt(res[0].stock));
    myQuantity = res[0].stock;
    if(myQuantity >= quantity)//if the item is in stock, make the sale
    {
      placeOrder(item,myQuantity - quantity,quantity);
    }
    else//we don't have that many.  let's try again?
    {
      console.log("I'm sorry, we only have " + myQuantity + " of those.");
      takeOrder();
    }
  });
}

function checkItem(item,quantity)
{
  connection.query("SELECT * FROM products WHERE item_id = ?",item, function(err, res) 
  {
    if (err) throw err;
    if(res.length > 0)//if the item is in stock, make the sale
    {
      //console.log("that's a valid item");
      addMoreInventory(item,quantity);
    }
    else//we don't have that many.  let's try again?
    {
      console.log("That's not a valid item. Please choose a valid Item ID.");
      addInventory();
    }
  });
}

function createAnotherDepartment(name,cost)
{
  connection.query(
    "INSERT INTO departments SET ?",
    {
      department_name: name,
      over_head_costs: cost
    },
    function(err, res) 
    {
      if (err) throw err;
      console.log(name + " added.");
      viewDepartments(); 
    });
 }


function viewDepartments()
{
  connection.query("SELECT * FROM departments", function(err, res) 
  {
  if (err) throw err;
  let config,data,output;
  var testing = [["Dept ID","Dept Name","Over Head Costs"]];
  for (var i = 0; i < res.length; i++) 
  {
    testing.push([res[i].department_id,res[i].department_name,res[i].over_head_costs]);
  }
  data = testing;
  config = 
  {
    columns: 
    {
      0: 
      {
          alignment: 'left',
          minWidth: 10
      },
      1: 
      {
          alignment: 'left',
          minWidth: 10
      },
      2: 
      {
          alignment: 'right',
          minWidth: 10
      }
    },
    drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === size;
    }
  };
  output = table(data, config);
  console.log(output);
  showMenu();
  }); 
 }

function viewDepartmentSales()
{
  var myQuery = "select departments.department_id,departments.department_name,departments.over_head_costs,(SELECT FORMAT(SUM(product_sales),2) FROM products where products.department_name = departments.department_name) AS product_sales, (SELECT FORMAT(SUM(product_sales),2) FROM products where products.department_name = departments.department_name) - departments.over_head_costs AS total_profit from departments INNER JOIN products ON departments.department_name = products.department_name group by departments.department_id";
  connection.query(myQuery, function(err, res) 
  {
  if (err) throw err;
  let config,data,output;
  var testing = [["Dept ID","Dept Name","Over Head Costs","Product Sales","Total Profit"]];
  for (var i = 0; i < res.length; i++) 
  {
    testing.push([res[i].department_id,res[i].department_name,res[i].over_head_costs,res[i].product_sales,res[i].total_profit.toFixed(2)]);
  }
  data = testing;
  config = 
  {
    columns: 
    {
      0: 
      {
          alignment: 'left',
          minWidth: 10
      },
      1: 
      {
          alignment: 'left',
          minWidth: 10
      },
      2: 
      {
          alignment: 'right',
          minWidth: 10
      },
      3: 
      {
          alignment: 'right',
          minWidth: 10
      },
      4: 
      {
          alignment: 'right',
          minWidth: 10
      }
    },
    drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === size;
    }
  };
  output = table(data, config);
  console.log(output);
  showMenu();
  }); 
 }


function createDepartment()
{
  var department_name = " ";
  var over_head_costs = 0;
  inquirer.prompt([
  {
    type: "input",
    name: "name",
    message: "Enter a name for the new department. Type 0 for the main menu."
  }
  ]).then(function(answer) 
  {
    department_name = answer.name;
    if(department_name == 0)
    {
      showMenu();
    }
    else
    {
      inquirer.prompt([
      {
        type: "input",
        name: "cost",
        message: "What is the over head cost for this department? Type 0 for the main menu.",
        validate: function(aNumber)
        {
          if(aNumber.match(/^\s*-?(\d+(\.\d{1,2})?|\.\d{1,2})\s*$/))//is it a decimal up to 4 places?
          {
            return true;
          }
          else
          return "Please enter a cost ex: 34.55";//we are totally not cool 
        }
      }
      ]).then(function(answer) 
      {
        over_head_costs = answer.cost;
        if(over_head_costs == 0)
        {
          showMenu();
        }
        else
        {
          createAnotherDepartment(department_name,over_head_costs)
        }
      });
    }
  });
}



function addInventory()
{
  var itemId = 0;
  var itemQuantity = 0;
  inquirer.prompt([
  {
    type: "input",
    name: "whatID",
    message: "What product ID would you like to add inventory to? Type 0 for the main menu.",
    validate: function(aNumber)
    {
      if(aNumber.match(/^\d+$/))//is it even a number?
      {
        return true;
      }
      else
      return "Please type a product ID Number";//we are totally not cool 
    }
  }
  ]).then(function(answer) 
  {
    itemId = answer.whatID;
    if(itemId == 0)
    {
      showMenu();
    }
    else
    {
      inquirer.prompt([
      {
        type: "input",
        name: "howMany",
        message: "How many would you like to add? Type 0 for the main menu.",
        validate: function(aNumber)
        {
          if(aNumber.match(/^\d+$/))//is it even a number?
          {
            return true;
          }
          else
          return "Please enter a Number - How many would you like?";//we are totally not cool 
        }
      }
      ]).then(function(answer) 
      {
        itemQuantity = answer.howMany;
        if(itemQuantity == 0)
        {
          showMenu();
        }
        else
        {
          checkItem(itemId, itemQuantity);
        }
      });
    }
  });
}






function ViewLow(quantity)
{
  connection.query("SELECT * FROM products WHERE stock < ?",quantity, function(err, res) 
  {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    //console.log(res[0]);
    //console.log(parseInt(res[0].stock));
    if(res.length == 0)
    {
      console.log("No items are low");
    }
    else
    {
      console.log("The following items are low");
      res.forEach(printItem);
    }
    showMenu();
  });
}

function printItem(item,index)
{//give me the id, name and price and show it pretty
  if(item.product_name.length > 15)
  {
    console.log("ID: " + item.item_id + "\t" + item.product_name + "\t" + item.price + "\t" + " Stock: " + item.stock + "\t" + "Department: " + item.department_name);
  }
  else
  {
    console.log("ID: " + item.item_id + "\t" + item.product_name + "\t\t" + item.price + "\t" + " Stock: " + item.stock + "\t" +"Department: " + item.department_name);
  }
}


function showMenu()//display the manager options
{
  inquirer.prompt([
  {
    type: "list",
    message: "Welcome supervisor.  What would you like to do?",
    choices: ["View_Department_Sales", "Create_New_Department","View_Department_List","Quit"],
    name: "menuChoice"
  }
  ])
  .then(function(answer) 
  {
    //which option did thay choose?
    switch(answer.menuChoice) //which command did i pick?
    {//call the chosen command
      case "View_Department_Sales":
        viewDepartmentSales();
          break;
      case "Create_New_Department":
        createDepartment();
          break;
      case "View_Department_List":
        viewDepartments();
          break;
      case "Quit":
        connection.end();
        return;
    }
  });
}