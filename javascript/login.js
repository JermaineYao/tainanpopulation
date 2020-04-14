
  d3.selectAll(".imgBlock").each(function () {
    d3.select(this).on("mouseover", function () {
      d3.select(this).transition().duration(200).style("opacity", "0.3");
    });
    d3.select(this).on("mouseout", function () {
      d3.select(this).transition().duration(3000).style("opacity", "1");
    })
  });

  d3.selectAll(".imgBlock2 p").each(function () {
    d3.select(this).on("mouseover", function () {
      d3.select(this).transition().duration(200).style("background-color", "#000");
    });
    d3.select(this).on("mouseout", function () {
      d3.select(this).transition().duration(5000).style("background-color", "rgba(157, 170, 209, 0.8)");
    })
  });

  let mapUrl = "https://raw.githubusercontent.com/JermaineYao/tainanp/master/twGeo.json";

  ~async function () {
    let tainanArray = [];
    await fetch(mapUrl).then(res => res.json())
                 .then(function (data) {
                        let dataGeo = [];
                        dataGeo.push(data);
                        let geoArray = dataGeo[0].features;
                        geoArray.forEach(function (v, i) {
                         if(v.properties.COUNTYID == "D"){
                           tainanArray.push(v);
                         }
                        });

                        let dataObject = {};
                        dataObject.type = "FeatureCollection";
                        dataObject.features = tainanArray;

                        let geoData = dataObject.features;
                        let mapProject = d3.geoMercator().scale(60000).center([120, 23]).translate([100, 550])

                        let geoPath = d3.geoPath().projection(mapProject);
                        d3.select("#geo").selectAll("path").data(geoData)
                                                           .enter()
                                                           .append("path")
                                                           .attr("d", geoPath)
                                                           .attr("data-city", (d) => d.properties.TOWNNAME)
                                                           .attr("data-en", (d) => d.properties.TOWNENG)
                                                           .attr("stroke", "#2C0075")
                                                           .attr("transform", "translate(0, 0)")
                                                           .attr("fill", "rgba(180, 180, 180, 1)");
                     });

    d3.selectAll("#geo path").each(function () {
      let townName = d3.select(this).attr("data-city");
      let townEng = d3.select(this).attr("data-en");

      d3.select(this).on("mouseover", function () {
        d3.selectAll("#geo path").transition().duration(200).ease(d3.easeCubicOut).attr("transform", "translate(0, 0)")
        d3.select(this).transition().duration(1500).ease(d3.easeCubicOut).attr("transform", "translate(0, -3)")

        document.getElementById("reviewTown").textContent = townName;
        document.getElementById("reviewTownEng").textContent = townEng;
      });
      d3.select(this).on("mouseout", function () {
        d3.select(this).transition().duration(200).ease(d3.easeCubicOut).attr("transform", "translate(0, 0)")
        document.getElementById("reviewPeople").textContent = "";
        document.getElementById("reviewTown").textContent = "";
        document.getElementById("reviewTownEng").textContent = "";
      });
      d3.select(this).on("click", function () {
        d3.selectAll("#geo path").attr("fill", "rgba(180, 180, 180, 0.7)");
        d3.select(this).attr("transform", "translate(0, -3)");
        d3.select(this).attr("fill", "rgba(157, 170, 209, 0.8)");
        d3.select("#selection").selectAll("li").attr("class", "");
        document.getElementById("townName").textContent = "";
        document.getElementById("townName").textContent = townName;
        document.getElementById("townEng").textContent = "";
        document.getElementById("townEng").textContent = townEng;
        d3.select("#selection").selectAll("ul").style("opacity", "0");
        d3.select("#gender").style("opacity", "1");
        d3.select("#mouth").style("opacity", "1");
        d3.select("#confirm").style("opacity", "1");
        condition = {};
        condition.zone = townName;
      });
    });

    d3.select("#tainanCity").on("click", function () {
      d3.selectAll("#geo path").attr("fill", "rgba(157, 170, 209, 0.8)");
      d3.selectAll("#geo path").attr("transform", "translate(0, -3)");
      d3.select("#selection").selectAll("li").attr("class", "");
      document.getElementById("townName").textContent = "";
      document.getElementById("townName").textContent = "臺南市";
      document.getElementById("townEng").textContent = "";
      document.getElementById("townEng").textContent = "Tainan";
      d3.select("#selection").selectAll("ul").style("opacity", "1");
      d3.select("#confirm").style("opacity", "1");
      condition = {};
      condition.zone = "臺南市";
    });
  }();

  function setCondition(group, v) {
    v.addEventListener("click", function () {
      group.forEach(function (d, i) {
        group[i].setAttribute("data-click", "false");
        group[i].setAttribute("class", "");
      });
      v.setAttribute("data-click", "true");
      v.setAttribute("class", "selected");
      let k = v.parentElement.getAttribute("id");
      condition[k] = v.getAttribute("data") || v.textContent;
    });
  };

  let gender = Array.from(document.querySelectorAll("#gender li"));
  gender.map(function (v, i) {
    setCondition(gender, v);
  });

  let mouth = Array.from(document.querySelectorAll("#mouth li"));
  mouth.map(function (v, i) {
    setCondition(mouth, v);
  });

  let age = Array.from(document.querySelectorAll("#age li"));
  age.map(function (v, i) {
    setCondition(age, v);
  });

  let ageArray = [];
  for (i = 1; i < age.length; i++) {
    ageArray.push(age[i].textContent);
  };

  let condition = {}; // 篩選條件
  let populationData = [], // 行政區人口數 或 臺南市總人口
      countArray = [], //age 人口數
      mw = []; //男+女
  let dataMax,
      dataMin,
      sum;
  let colorMin,
      colorMax;
  let str;

  let populationUrl = "https://raw.githubusercontent.com/JermaineYao/tainanp/master/population.json";
  fetch(populationUrl).then(res => res.json())
                      .then(function (population) {
                       // 過濾篩選條件後的數據
                       document.getElementById("confirm").addEventListener("click", function (e) {

                         populationData = [];
                         countArray = [];
                         mw = [];
                         if (condition.zone == "臺南市") {
                           population.map(function (v, i) {
                             if ((v["性別"] == condition.gender) && (v["月份"] == condition.mouth) && (v["區域別"] == "臺南市") && (condition.age == "總計")) {
                                mw.push(v);
                              } else if ((v["性別"] == condition.gender) && (v["月份"] == condition.mouth)) {
                               if (v["區域別"] != "臺南市") {
                                 let data = {};
                                 data["區域別"] = v["區域別"];
                                 data["月份"] = v["月份"];
                                 data["性別"] = v["性別"];
                                 data["百分比"] = v["百分比"];
                                 data[condition.age] = v[condition.age];
                                 countArray.push(parseInt(v[condition.age], 10));
                                 countArray.sort(function (a, b) {
                                   return a-b;
                                 });
                                 dataMin = countArray[0];
                                 dataMax = countArray[countArray.length - 1];
                                 sum = countArray.reduce(function (acc, curValue) {
                                   return acc + curValue;
                                 })
                                 populationData.push(data);
                                }
                               } else if ((v["選擇"] == condition.gender) && (v["月份"] == condition.mouth) && (v["區域別"] == "臺南市") && (condition.age == "總計")) {
                                  mw.push(v);
                               } else if ((v["選擇"] == condition.gender) && (v["月份"] == condition.mouth) && (v["區域別"] == "臺南市") && (condition.age != "總計")) {
                                  mw.push(v);
                               }
                           });

                           clearSvg("#chart");
                           drawBand();
                           if ((condition.age == "總計") && (condition.gender != "計")) {
                             areaColor();
                             drawBandAge();
                           };

                           if ((condition.age == "總計") && (condition.gender == "計")) {
                             areaColor();
                             drawStack();

                           }
                         } else if (condition.zone != "臺南市") {
                           population.map(function (v, i) {
                             if ((v["性別"] == condition.gender) && (v["月份"] == condition.mouth) && (v["區域別"] == condition.zone)) {
                               mw.push(v);
                             } else if ((v["選擇"] == condition.gender) && (v["月份"] == condition.mouth) && (v["區域別"] == condition.zone)) {
                               mw.push(v);
                             };
                           });
                           clearSvg("#chart");
                           if ((condition.gender == "計")) {
                             drawStack();
                           } else if ((condition.gender != "計")) {
                             drawBandAge();
                           }
                         };
                       });
                   });

  function setColor() {
    if (condition.gender == "女") {
      colorMin = "#fae0b2";
      colorMax = "#cc0a78";
    } else if (condition.gender == "男") {
      colorMin = "#aff7ff";
      colorMax = "#6313dd";
    } else {
      colorMin = "#d8fef8";
      colorMax = "#dec50b";
    }
  };

  function areaColor() {
    setColor();
    let color = d3.scaleSequential().domain([dataMin, dataMax]).interpolator(d3.interpolate(colorMin, colorMax));
    let path = d3.selectAll("#geo path");
    populationData.map(function (v, i) {
      path.each(function () {
        if (v["區域別"] == d3.select(this).attr("data-city")) {
          d3.select(this).attr("fill", color(parseInt(v[condition.age], 10)))
        };
      })
    });
  };

  function setStr() {
    if ( condition.gender != "計") {
       str = `2019 ${condition.mouth}月 ${condition.zone} ${condition.age} ${condition.gender}性人口統計`
    } else {
       str = `2019 ${condition.mouth}月 ${condition.zone} ${condition.age} 人口統計`
    }
  }

  function clearSvg(svgId) {
    d3.select(svgId).selectAll("svg").remove();
  }

  function drawBand() {
    d3.select("#chart").append("svg").attr("id", "band")
                                     .attr("width", 1400)
                                     .attr("height", 1000);

    setStr();
    setColor();
    let color = d3.scaleSequential().domain([dataMin, dataMax]).interpolator(d3.interpolate(colorMin, colorMax));
    let bandScaleX = d3.scaleBand().domain(countArray).rangeRound([0, 1200]);
    let bandScaleY = d3.scaleLinear().domain([dataMin, dataMax]).range([10, 800]);
    let bandX = bandScaleX.paddingInner(0.1)
                          .paddingOuter(0.3)
                          .align(0.5);

    d3.select("#band").selectAll("rect").data(populationData)
                                        .enter()
                                        .append("rect")
                                        .attr("x", d => bandX(d[condition.age])+100)
                                        .attr("y", d => 850 - bandScaleY(d[condition.age]))
                                        .attr("width", 0)
                                        .attr("height", d => bandScaleY(d[condition.age]))
                                        .attr("fill", d => color(parseInt(d[condition.age], 10)));
                                        // .attr("filter", "url(#glass)");

    d3.select("#band").selectAll("text").data(populationData)
                                        .enter()
                                        .append("text")
                                        .attr("x", d => bandX(d[condition.age])+100)
                                        .attr("y", d => 840 - bandScaleY(d[condition.age]))
                                        .text(d => d[condition.age])
                                        .attr("font-size", "10")
                                        .attr("text-anchor", "start")
                                        .attr("fill", "#470374");

    d3.select("#band").append("g");
    d3.select("#band g").selectAll("text").data(populationData)
                                        .enter()
                                        .append("text")
                                        .attr("x", d => bandX(d[condition.age])+116)
                                        .attr("y", 860)
                                        .text(d => d["區域別"])
                                        .attr("font-size", "14")
                                        .attr("text-anchor", "start")
                                        .attr("writing-mode", "vertical-rl")
                                        .attr("fill", "#470374");

    d3.select("#band").selectAll("rect").transition().delay(1000).duration(800)
                                                                 .ease(d3.easeBounceOut)
                                                                 .attr("width", d => bandX.bandwidth(d));

    let yScaleLinear = d3.scaleLinear().domain([dataMin, dataMax]).range([800, 10]);
    let yAxisLeft = d3.axisLeft(yScaleLinear);

    let svgScale = d3.select("#band");
    svgScale.append("g")
            .attr("id", "left")
            .attr("transform", "translate(100, 50)")
            .call(yAxisLeft);

    d3.selectAll("#left line").attr("stroke", "#470374");
    d3.selectAll("#left text").attr("fill", "#470374");
    d3.select("#left path").attr("stroke", "#470374");

    d3.select("#band").append("text").attr("x", 200)
                                     .attr("y", 100)
                                     .attr("font-size", 30)
                                     .attr("fill", "#fff")
                                     .text(str);
  };

  function drawBandAge() {
    d3.select("#chart").append("svg").attr("id", "bandAge")
                                     .attr("width", 1000)
                                     .attr("height", 1000);
    setStr();
    setColor();
    let a;
    if (condition.gender != "計") {
      a = 0;
    }

    let data = [];
    ageArray.map(function (v, i) {
      data.push(parseInt(mw[a][v], 10));
    });

    let min = d3.min(data);
    let max = d3.max(data);

    let color = d3.scaleSequential().domain([min, max]).interpolator(d3.interpolate(colorMin, colorMax));
    let bandScaleX = d3.scaleBand().domain(data).rangeRound([0, 800]);
    let bandScaleY = d3.scaleLinear().domain([min, max]).range([10, 800]);
    let bandX = bandScaleX.paddingInner(0.19)
                          .paddingOuter(0.3)
                          .align(0.5);

    d3.select("#bandAge").selectAll("rect").data(ageArray)
                                        .enter()
                                        .append("rect")
                                        .attr("x", d => bandX(mw[a][d])+150)
                                        .attr("y", d => 850 - bandScaleY(mw[a][d]))
                                        .attr("width", d => bandX.bandwidth(d))
                                        .attr("height", d => bandScaleY(mw[a][d]))
                                        .attr("fill", d => color(parseInt(mw[a][d], 10)));
                                        // .attr("filter", "url(#glass)");

    d3.select("#bandAge").selectAll("text").data(ageArray)
                                        .enter()
                                        .append("text")
                                        .attr("x", d => bandX(mw[a][d])+150)
                                        .attr("y", d => 840 - bandScaleY(mw[a][d]))
                                        .text(d => mw[a][d])
                                        .attr("font-size", "10")
                                        .attr("text-anchor", "start")
                                        .attr("fill", "#470374");
    d3.select("#bandAge").append("g");
    d3.select("#bandAge g").selectAll("text").data(ageArray)
                                             .enter()
                                             .append("text")
                                             .attr("x", d => bandX(mw[a][d])+166)
                                             .attr("y", 860)
                                             .text(d => d)
                                             .attr("font-size", "14")
                                             .attr("text-anchor", "start")
                                             .attr("writing-mode", "vertical-lr")
                                             .attr("fill", "#470374");

    let yScaleLinear = d3.scaleLinear().domain([min, max]).range([800, 10]);
    let yAxisLeft = d3.axisLeft(yScaleLinear);

    let svgScale = d3.select("#bandAge");
    svgScale.append("g")
            .attr("id", "left")
            .attr("transform", "translate(150, 50)")
            .call(yAxisLeft);

    d3.selectAll("#left line").attr("stroke", "#470374");
    d3.selectAll("#left text").attr("fill", "#470374");
    d3.select("#left path").attr("stroke", "#470374");

    d3.select("#bandAge").append("text").attr("x", 800)
                                        .attr("y", 100)
                                        .attr("font-size", 30)
                                        .attr("fill", "#fff")
                                        .text("年齡分布圖");
                                        d3.select("#bandAge").append("text").attr("x", 800)
                                                                            .attr("y", 150)
                                                                            .attr("font-size", 30)
                                                                            .attr("fill", "#fff")
                                                                            .text(`共${mw[0]["總計"]} 人`);
  };

  function drawStack() {
    d3.select("#chart").append("svg").attr("id", "stack")
                                     .attr("width", 1200)
                                     .attr("height", 1000)
                                     .append("g").attr("transform", "translate(80, 100)");
    setStr();

    let dataFemale = [];
    ageArray.map(function (v, i) {
      dataFemale.push(parseInt(mw[0][v], 10));
    });

    let minFemale = d3.min(dataFemale);
    let maxFemale = d3.max(dataFemale);

    let dataMale = [];
    ageArray.map(function (v, i) {
      dataMale.push(parseInt(mw[1][v], 10));
    });

    let minMale = d3.min(dataMale);
    let maxMale = d3.max(dataMale);

    let data = [],
        ageSum = [];

    ageArray.map(function (v, i) {
      let ageData = {};
      ageData.age = v;
      ageData.female = parseInt(mw[0][v], 10);
      ageData.male = parseInt(mw[1][v], 10);
      data.push(ageData);
      ageSum.push(ageData.female + ageData.male);
    });

    let yMin = d3.min(ageSum);
    let yMax = d3.max(ageSum);
    let yScale = d3.scaleLinear().domain([yMin, yMax]).range([800, 0]);

    let colorFemale = d3.scaleSequential().domain([minFemale, maxFemale])
                                          .interpolator(d3.interpolate("#fae0b2","#cc0a78"));
    let colorMale = d3.scaleSequential().domain([minMale, maxMale])
                                        .interpolator(d3.interpolate("#aff7ff","#6313dd"));

    let stackObject = d3.stack().keys(["female", "male"]);
    let stackData = stackObject(data);

    d3.select("#stack").select("g").selectAll("g")
                                   .data(stackData)
                                   .enter()
                                   .append("g")
                                   .attr("id", d => d["key"])
                                   .selectAll("rect")
                                   .data(d => d)
                                   .enter()
                                   .append("rect")
                                   .attr("class", "stackBar")
                                   .attr("data-count", d => d[1] - d[0])
                                   .attr("x", (d, i) => 11 + i*50)
                                   .attr("y", d => yScale(d[1]))
                                   .attr("width", 0)
                                   .attr("height", d => yScale(d[0]) - yScale(d[1]));
    // 設定 transition
    let stack = true;
    function stackTs() {
     d3.selectAll(".stackBar").transition().delay(800)
                                           .transition(1000)
                                           .ease(d3.easeBounceOut)
                                           .attr("width", 39);
     stack = false;
    }

    // 顯示資訊
    d3.select("#female").selectAll("rect").each(function () {
      let c = d3.select(this).attr("data-count");
      d3.select(this).attr("fill", colorFemale(c));
    });

    d3.select("#male").selectAll("rect").each(function () {
      let c = d3.select(this).attr("data-count");
      d3.select(this).attr("fill", colorMale(c));
    });

    d3.select("#stack").append("g").attr("id", "text");
    d3.select("#text").selectAll("text").data(ageArray)
                                        .enter()
                                        .append("text")
                                        .attr("x", (d, i) => 111+ i*50)
                                        .attr("y", 910)
                                        .text(d => d)
                                        .attr("font-size", "14")
                                        .attr("text-anchor", "start")
                                        .attr("writing-mode", "vertical-lr")
                                        .attr("fill", "#470374");

    d3.select("#stack").append("g").attr("id", "t1");
    d3.select("#t1").selectAll("text").data(ageSum)
                                      .enter()
                                      .append("text")
                                      .attr("x", (d, i) => 96+ i*50)
                                      .attr("y", d => yScale(d) +60)
                                      .text((d, i) => data[i].male)
                                      .attr("font-size", "10")
                                      .attr("text-anchor", "start")
                                      .attr("fill", "#470374");

    d3.select("#stack").append("g").attr("id", "t2");
    d3.select("#t2").selectAll("text").data(ageSum)
                                      .enter()
                                      .append("text")
                                      .attr("x", (d, i) => 96+ i*50)
                                      .attr("y", d => yScale(d) +90)
                                      .text((d, i) => data[i].female)
                                      .attr("font-size", "10")
                                      .attr("text-anchor", "start")
                                      .attr("fill", "#470374");

    d3.select("#stack").append("g").attr("id", "line");
    d3.select("#line").selectAll("line").data(ageSum)
                                        .enter()
                                        .append("line")
                                        .attr("x1", (d, i) => 96+ i*50)
                                        .attr("y1", d => yScale(d) +72)
                                        .attr("x2", (d, i) => 111+ i*50)
                                        .attr("y2", d => yScale(d) +72)
                                        .attr("stroke", "#fff");

    d3.select("#stack").append("rect").attr("x", 50)
                                      .attr("y", 80)
                                      .attr("width", 100)
                                      .attr("height", 20)
                                      .attr("opacity", 0.8)
                                      .attr("fill", "url(#f)");

    d3.select("#stack").append("rect").attr("x", 50)
                                      .attr("y", 50)
                                      .attr("width", 100)
                                      .attr("height", 20)
                                      .attr("opacity", 0.8)
                                      .attr("fill", "url(#m)");

    d3.select("#stack").append("text").attr("x", 160)
                                      .attr("y", 65)
                                      .text("男性人口")
                                      .attr("fill", "#fff");

    d3.select("#stack").append("text").attr("x", 160)
                                      .attr("y", 95)
                                      .text("女性人口")
                                      .attr("fill", "#fff");

    d3.select("#stack").append("text").attr("x", 850)
                                        .attr("y", 80)
                                        .attr("font-size", 30)
                                        .attr("fill", "#fff")
                                        .text("年齡/性別 分布圖");

    /*--- pie chart ---*/
    let pie = [];
    ageArray.map(function (v, i) {
      let ageData = {};
      ageData.age = v;
      ageData.gender = "female"
      ageData.count = parseInt(mw[0][v], 10);
      pie.push(ageData);
    });

    ageArray.map(function (v, i) {
      let ageData = {};
      ageData.age = v;
      ageData.gender = "male";
      ageData.count = parseInt(mw[0][v], 10);
      pie.push(ageData);
    });

    d3.select("#chart").append("svg").attr("id", "pie")
                                     .attr("width", 1000)
                                     .attr("height", 1000)
                                     .append("g")
                                     .attr("id" , "pieChart");
    d3.select("#pieChart").attr("transform", "translate(500, 500)")

    let pieObject = d3.pie().startAngle(0)
                            .endAngle(2*Math.PI)
                            .padAngle(0.001*Math.PI)
                            .value(d => d.count)
                            .sort((a,b) => {return b.gender.localeCompare(a.gender)})

    let pieData = pieObject(pie);
    let arcObject = d3.arc().innerRadius(200)
                            .outerRadius(300);

    let pies = true;
    function drawPie() {
      d3.select("#pieChart").selectAll("path").data(pieData)
                                              .enter()
                                              .append("path")
                                              .attr("fill", function (d) {
                                                if (d.data.gender == "female") {
                                                  return colorFemale(d.value)
                                                } else if (d.data.gender == "male") {
                                                  return colorMale(d.value)
                                                }
                                              })
                                              .attr("data-age", d => d.data.age)
                                              .attr("data-count", d => d.value)
                                              .attr("data-gender", d => d.data.gender)
                                              .transition().delay(100).duration(500)
                                              .ease(d3.easeBounceOut)
                                              .attrTween("d", function(d) {
  		                                              let i = d3.interpolate(d.startAngle, d.endAngle);
  		                                              return function(t) {
  			                                              d.endAngle = i(t);
  			                                              return arcObject(d)
                                                    };
  		                                         }).on("end", function (d) {
                                                 d3.selectAll("#pieChart path").each(function (d) {
                                                   d3.select(this).on("mouseover", function (d) {
                                                     let age = d3.select(this).attr("data-age");
                                                     let count = d3.select(this).attr("data-count");
                                                     let gender;
                                                     d3.select(this).attr("data-gender") == "female" ? gender = "女性" : gender = "男性"
                                                     d3.select("#pieAge").text(`${age} ${gender} 共 ${count} 人`);
                                                     d3.select(this).transition().duration(500).ease(d3.easeCubicOut)
                                                                                               .attr("stroke", "#fff")
                                                   });

                                                   d3.select(this).on("mouseout", function (d) {
                                                     d3.select("#pieAge").text("");
                                                     d3.select(this).transition().duration(500).ease(d3.easeCubicOut)
                                                                                               .attr("stroke", "none")
                                                   });
                                                 });
                                               });
      pies = false;
    };

    d3.select("#pieChart").append("text").attr("x", 0)
                                         .attr("y", 50)
                                         .attr("font-size", 22)
                                         .attr("fill", "#fff")
                                         .attr("text-anchor", "middle")
                                         .text(`${condition.zone} 共 ${mw[2]["總計"]} 人`);

    d3.select("#pieChart").append("text").attr("x", 0)
                                         .attr("y", -25)
                                         .attr("id", "pieAge")
                                         .attr("font-size", 22)
                                         .attr("fill", "#fff")
                                         .attr("text-anchor", "middle")
                                         .text("");

    // scroll 顯示圖表, true false 條件讓 事件只觸發一次
    window.addEventListener("scroll", function (e) {
      let showStack = document.getElementById("stack");
      let showPie = document.getElementById("pie");

      if((window.innerHeight - showStack.getBoundingClientRect().top > (showStack.getBoundingClientRect().height/5)) && stack == true) {
        stackTs();
      };
      if((window.innerHeight - showPie.getBoundingClientRect().top > (showPie.getBoundingClientRect().height/4)) && pies == true) {
        drawPie();
      };

    });
  };
