async function fetchData() {
  // 加载宽格式数据
  const wideData = await d3.csv("./dataset/videogames_wide.csv");
  // 加载长格式数据
  const longData = await d3.csv("./dataset/videogames_long.csv");
  return { wideData, longData };
}

fetchData().then(async ({ wideData, longData }) => {
  
 // 热力图：按游戏类型和平台的全球销量
  const vlSpec = vl
    .markRect()
    .data(wideData)
    // 使用Vega Lite的transform进行数据汇总
    .transform(
      {
        aggregate: [{op: "sum", field: "Global_Sales", as: "total_sales"}],
        groupby: ["Genre", "Platform"]
      }
    )
    .encode(
     vl.x().fieldN("Platform").title("Platform"),
      vl.y().fieldN("Genre").title("Genre"),
      vl.color().fieldQ("total_sales").title("Global Sales"), 
      
    vl.tooltip([
        vl.fieldN("Genre"),
        vl.fieldN("Platform"),
        {
          field: "total_sales",
          type: "quantitative",
          format: ".2f",
          title: "Total Sales (M)"
        }
      ])
    )
    .title("Global Sales by Genre and Platform")
    .width("container")
    .height(400)
    .toSpec();


//View 2: 全球销量柱状图
  
  // 1. 定义交互：点击图例筛选
  const genreSelect = vl.selectPoint('genreSelect')
    .fields('Genre')    // 绑定字段
    .bind('legend');    // 【关键】绑定到图例上，实现“点击小图标”效果

  const vlSpec2 = vl
    .markBar()
    .data(wideData)
    .transform(
      // 记得加上 groupby，否则只会显示一根总柱子
      vl.aggregate(
        [{op: "sum", field: "Global_Sales", as: "total_sales"}]
      ).groupby(["Genre"]) 
    )
    .params(genreSelect) 
    .encode(
      // X轴：游戏类型 (按销量排序)
      vl.x().fieldN("Genre")
        .sort("-y")
        .title("Genre"),

      // Y轴：全球销量
      vl.y().fieldQ("total_sales")
        .title("Global Sales (Millions)"),

      // 颜色
      vl.color().fieldN("Genre")
        .title("Genre")
        .scale({scheme: "tableau20"}),

      // 【关键】交互逻辑：点击图例时，选中的不透明(1)，没选中的变淡(0.1)
      vl.opacity()
        .condition({param: "genreSelect", value: 1})
        .value(0.1),

      // Tooltip
      vl.tooltip([
        vl.fieldN("Genre"),
        {field: "total_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Global Sales by Genre")
    .width("container")
    .height(400)
    .toSpec();

//View 3: 悬停高亮折线图 Hover & Highlight
const platformHover = vl.selectPoint('platformHover')
    .fields('Platform')
    .on('pointerover')
    .clear('pointerout')
    .bind('legend');

  const lineSpec = vl
    .markLine({
      interpolate: 'monotone',
      point: false
    })
    .data(wideData)
    .transform(
      vl.filter("datum.Year > 0"),

      // Lifetime Sales
      // joinaggregate 会在每一行数据上附加上该平台的总销量，而不改变行数
      vl.joinaggregate([
        {op: "sum", field: "Global_Sales", as: "platform_lifetime_sales"}
      ]).groupby(["Platform"]),

      // 这里设定阈值为 280M 只保留大平台，线条会少而精
      vl.filter("datum.platform_lifetime_sales > 280"),

      // 4. 按年份聚合 (原有的逻辑)
      vl.aggregate(
        [{op: "sum", field: "Global_Sales", as: "total_sales"}]
      ).groupby(["Year", "Platform"]),

      // 5. 【新增】过滤单年销量过低的点 (可选)
    
      vl.filter("datum.total_sales > 1")
    )
    .params(platformHover)
    .encode(
      vl.x().fieldQ("Year")
        .scale({ zero: false })
        .axis({ format: "d", title: "Release Year" }),

      vl.y().fieldQ("total_sales")
        .title("Total Sales (Millions)"),

      vl.color().fieldN("Platform").title("Platform"),
      
      // 交互样式
      vl.opacity().condition({param: "platformHover", value: 1}).value(0.1),
      vl.strokeWidth().condition({param: "platformHover", empty: false, value: 3}).value(2),
      vl.order().condition({param: "platformHover", value: 1}).value(0),

      vl.tooltip([
        vl.fieldN("Platform"),
        vl.fieldQ("Year"),
        {field: "total_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Sales Trends by Major Platform (>280M Lifetime Sales)")
    .width("container")
    .height(500)
    .toSpec();

// view 4
/// --- View 4 (Fixed): Top 8 Genre Sales (Fixed Hover) ---

  // 1. Define Interaction
  // Removed 'nearest(true)' so it triggers when you touch the line itself
  const genreHighlight = vl.selectPoint('genreHighlight')
    .fields('Genre')
    .bind('legend')      // Interactive Legend
    .on('mouseover')     // Trigger on hover
    .clear('mouseout');  // Clear when mouse leaves

  const top8GenreSpec = vl
    .markLine({
      interpolate: 'monotone',
      strokeWidth: 3, // Base thickness
      point: true     // [OPTIONAL] Set to true if you want dots, or keep false for clean lines
    })
    .data(wideData)
    .transform(
      // 1. Filter Year
      vl.filter("datum.Year >= 2000"),

      // 2. Calculate Total Sales per Genre
      vl.joinaggregate([
        {op: "sum", field: "Global_Sales", as: "genre_total_sales"}
      ]).groupby(["Genre"]),

      // 3. Rank and Filter Top 5
      vl.window([
        {op: "dense_rank", field: "genre_total_sales", as: "rank"}
      ]).sort([
        {field: "genre_total_sales", order: "descending"}
      ]),
      vl.filter("datum.rank <= 5"),

      // 4. Aggregate for the chart
      vl.aggregate(
        [{op: "sum", field: "Global_Sales", as: "total_sales"}]
      ).groupby(["Year", "Genre"])
    )
    .params(genreHighlight)
    .encode(
      // X & Y Axis
      vl.x().fieldQ("Year")
        .scale({ zero: false })
        .axis({ format: "d", title: "Year" }),
      
      vl.y().fieldQ("total_sales")
        .title("Global Sales (Millions)"),

      // Color
      vl.color().fieldN("Genre")
        .title("Genre")
        .sort({field: "total_sales", op: "sum", order: "descending"})
        .scale({scheme: "tableau10"}),

      // --- Interaction Styling ---

      // 1. Opacity: Fade out non-selected lines
      vl.opacity()
        .condition({param: "genreHighlight", value: 1})
        .value(0.1),

      // 2. Stroke Width: Thicken the hovered line
      vl.strokeWidth()
        .condition({param: "genreHighlight", empty: false, value: 6})
        .value(3),

      // 3. Order: Bring hovered line to front
      vl.order()
        .condition({param: "genreHighlight", value: 1})
        .value(0),

      // Tooltip
      vl.tooltip([
        {field: "Genre", title: "Genre"},
        {field: "Year", title: "Year"},
        {field: "total_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Sales Trends: Top 8 Genres (2000-2016)")
    .width("container")
    .height(500)
    .toSpec();


// --- View 5: 交互式水平分组柱状图 (Regional Sales) ---

  const regionHighlight = vl.selectPoint('regionHighlight')
    .fields('sales_region')
    .on('pointerover')
    .clear('pointerout')
    .bind('legend');

  const groupedBarHorizontalSpec = vl
    .markBar()
    .data(longData)
    .transform(
      // 1. 【关键修改】过滤年份：同步只看最近 10 年
      vl.filter("datum.year >= 2010"), 

      // 2. 数据清洗
      {
        calculate: "replace(datum.sales_region, '_', ' ')",
        as: "sales_region"
      },
      // 3. 计算平台在此期间的总销量
      {
        joinaggregate: [{op: "sum", field: "sales_amount", as: "platform_total"}],
        groupby: ["platform"]
      },
      // 4. 【关键修改】过滤低销量平台：阈值可根据最近10年的数据量调整
      vl.filter("datum.platform_total > 50"), // 只显示近期活跃或销量尚可的平台

      // 5. 绘图聚合
      {
        aggregate: [{op: "sum", field: "sales_amount", as: "total_sales"}],
        groupby: ["platform", "sales_region", "platform_total"]
      }
    )
    .params(regionHighlight)
    .encode(
      // Y轴：按销量排序
      vl.y().fieldN("platform")
        .sort({field: "platform_total", order: "descending"}) 
        .title("Platform"),

      vl.x().fieldQ("total_sales")
        .title("Sales Amount (Millions)"),

      vl.color().fieldN("sales_region")
        .title("Region")
        .scale({scheme: "category10"}),

      vl.yOffset().fieldN("sales_region"),

      vl.opacity()
        .condition({param: "regionHighlight", value: 1})
        .value(0.1),

      vl.tooltip([
        {field: "platform", title: "Platform"},
        {field: "sales_region", title: "Region"},
        {field: "total_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Regional Sales by Platform (Recent 10 Years)")
    .width(580)
    .height(800)
    .toSpec();


  // view：6堆叠柱状图：按平台和销售地区的销量
  const vlSpec3 = vl
    .markBar()
    .data(longData)
    // 使用Vega Lite的transform进行数据汇总
    .transform(
      // 将sales_region中的下划线替换为空格
      {
        calculate: "replace(datum.sales_region, '_', ' ')",
        as: "sales_region"
      },
      
    {
        joinaggregate: [{op: "sum", field: "sales_amount", as: "platform_total"}],
        groupby: ["platform"]
      },

      // 只保留全球总销量大于 10 (M) 的平台
      vl.filter("datum.platform_total > 10"),

      //聚合：按平台和地区汇总，准备画图
      {
        aggregate: [{op: "sum", field: "sales_amount", as: "total_sales"}],
        groupby: ["platform", "sales_region"]
      }
    )
    .params(
      {
        name: "regionSel",
        select: {
          type: "point",
          fields: ["sales_region"],
          // nearest: true,
          on: "pointerover",
          clear: "pointerout"
        },
        bind: "legend"
      }
    )
    .encode(
      // x轴：平台，按销售金额降序排序
      vl.x().fieldN("platform").sort("-y").title("Platform"),
      // y轴：销售金额
      vl.y().fieldQ("total_sales").title("Sales Amount"),
      // 颜色：销售地区
      vl.color().fieldN("sales_region").title("Sales Region"),
      // 不透明度：根据选择状态调整，高亮选中项
      vl.opacity().condition({param: "regionSel", value: 1}).value(0.3),
      // 边框：根据选择状态调整，高亮选中项
      vl.stroke().condition({param: "regionSel", empty: false}).value(null),
      // 顺序：确保选中的柱子显示在最上层
      vl.order().condition({param: "regionSel", value: 1}).value(0),
      // 工具提示
      
      vl.tooltip([
        vl.fieldN("platform"),
        vl.fieldN("sales_region"),
        {
          field: "total_sales",      // 字段名
          type: "quantitative",      // 类型：数值
          format: ".2f",             // 格式：保留两位小数
          title: "Total Sales (M)"   // 标题
        }      ])
    )
    .title("Sales by Platform and Region (Stacked Bar Chart)")
    .width(580)
    .height(400)
    .toSpec();



   //view7: Battle of the Giants in Japan) ---
  const jpPublisherSpec = vl
    .markLine({
      interpolate: "monotone", // 使用平滑曲线，更具现代感
      point: { filled: true, size: 60 } // 添加数据点，方便鼠标定位
    })
    .data(wideData) // 使用 wideData
    .transform(
      // 1. 过滤年份：聚焦现代游戏史 (1995-2016)
      vl.filter("datum.Year >= 1995 && datum.Year <= 2016"),
      
      // 2. 【关键】只筛选日本市场的几大核心发行商
      vl.filter(vl.field("Publisher").oneOf([
        "Nintendo", 
        "Namco Bandai Games", 
        "Konami Digital Entertainment", 
        "Sony Computer Entertainment", 
        "Capcom", 
        "Sega", 
        "Square Enix"
      ])),
      
      // 3. 聚合：计算每年、每个发行商在日本的销量
      {
        aggregate: [{op: "sum", field: "JP_Sales", as: "annual_sales"}],
        groupby: ["Year", "Publisher"]
      }
    )
    .params(
      // 定义交互：绑定图例点击 + 鼠标悬停
      {
        name: "publisher_focus",
        select: { type: "point", fields: ["Publisher"], on: "pointerover", clear: "pointerout" },
        bind: "legend"
      }
    )
    .encode(
      // X轴：年份
      vl.x().fieldQ("Year")
        .axis({format: "d", title: "Year", tickCount: 20}), // 增加刻度密度

      // Y轴：日本销量
      vl.y().fieldQ("annual_sales")
        .title("Japan Sales (Millions)"),

      // 颜色：区分发行商
      vl.color().fieldN("Publisher")
        .title("Publisher")
        .scale({scheme: "category10"}), // 使用高辨识度配色

      // --- 交互魔法 ---
      // 1. 透明度：未选中的变淡 (0.1)，选中的保持不透明 (1)
      vl.opacity()
        .condition({param: "publisher_focus", value: 1})
        .value(0.1),

      // 2. 线宽：选中的线条变粗 (4px)，突显主角光环
      vl.strokeWidth()
        .condition({param: "publisher_focus", empty: false, value: 4})
        .value(2),

      // 3. 层级：选中的线条浮在最上层，防止被遮挡
      vl.order()
        .condition({param: "publisher_focus", value: 1})
        .value(0),

      // 工具提示
      vl.tooltip([
        {field: "Publisher", title: "Publisher"},
        {field: "Year", title: "Year"},
        {field: "annual_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Battle of the Giants: Publisher Trends in Japan")
    .width(520)
    .height(400)
    .toSpec();

  // 渲染
  // render("#view7", jpPublisherSpec);

  // --- View 8: 游戏类型区域热力图 (使用 wideData + Fold 变换) ---
  const genreRegionSpec = vl
    .markRect({
        cornerRadius: 4 // 让方块带点圆角，更好看
    })
    .data(wideData) // 【关键】改回使用稳健的 wideData
    .transform(
      // 1. 【核心魔法】Fold 变换
      // 把宽数据里的 4 列销量变成 2 列： "Region" (key) 和 "Sales" (value)
      // 这样我们就不用担心 longData 的字段名问题了
      vl.fold(["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"])
        .as("Region", "Sales"),
        
      // 2. 聚合：计算每个类型在每个区域的总销量
      {
        aggregate: [{op: "sum", field: "Sales", as: "TotalSales"}],
        groupby: ["Genre", "Region"]
      }
    )
    .encode(
      // Y轴：游戏类型
      vl.y().fieldN("Genre")
        .title("Game Genre"),

      // X轴：区域 (把 NA_Sales 等名字简化一下显示会更好，但这里直接用也行)
      vl.x().fieldN("Region")
        .title("Sales Region")
        .axis({labelAngle: 0}), // 标签水平显示

      // 颜色：深浅代表销量
      vl.color().fieldQ("TotalSales")
        .title("Sales Amount (M)")
        .scale({scheme: "viridis"}), // 这种蓝绿黄配色对比度很高

      // 交互：鼠标悬停显示具体数值
      vl.tooltip([
        {field: "Genre", title: "Genre"},
        {field: "Region", title: "Region"},
        {field: "TotalSales", format: ".2f", title: "Sales (Millions)"}
      ])
    )
    .title("Genre Hotspots: Where is each Genre popular?")
    .width(540) // 热力图不需要太宽
    .height(400)
    .toSpec();


  // 渲染可视化
  render("#view", vlSpec);
  render("#view2", vlSpec2);
    render("#view3", lineSpec);
    render("#view4", top8GenreSpec);
    render("#view5", groupedBarHorizontalSpec);
    render("#view6", vlSpec3);
  render("#view7", jpPublisherSpec);
  render("#view8", genreRegionSpec);
  


  
});

// 渲染函数
async function render(viewID, spec) {
  const result = await vegaEmbed(viewID, spec);
  result.view.run();
}