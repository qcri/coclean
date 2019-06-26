import os
import sys
from subprocess import Popen
import json
from os import listdir, path
import ctypes
from ctypes import c_char_p
import pandas as pd
import csv
import numpy as np

from pandas.api.types import is_string_dtype

global tool_loc
tool_loc = path.join(path.dirname(__file__), "fahes")



########################################################################
#
#   (June 2019)
#
########################################################################

'''
@author: aqahtan@hbku.edu.qa


TODO: this function will receive only params as input, which is a JSON with all the information stored there
The forllowing implementation is to be compieant with the old api
# def executeService(params):


'''


def read_table(tab_name):
    try:
        df = pd.read_csv(filepath_or_buffer=tab_name, dtype=object, delimiter=',', low_memory=False,
                         quoting=csv.QUOTE_ALL, doublequote=True)
    except ValueError:
        try:
            df = pd.read_csv(filepath_or_buffer=tab_name, dtype=object, delimiter=',', low_memory=False,
                             quoting=csv.QUOTE_ALL, doublequote=True, encoding="ISO-8859-1")
        except:
            print("Error reading csv file .. file encoding is not recognizable")
            return []
    return df





def execute_fahes(source, out_path, debug=0):
    out_dir = ""

    # for EL in out_path:
    #     if EL.lower() == 'csv':
    #         out_dir = out_path[EL]['dir']

    out_dir = out_path

    output_dir = ""
    if out_dir:
        output_dir = os.path.abspath(out_dir)
        if not output_dir:
            print("Cannot locate absolute location of output directory")
    else:
        print("Cannot locate output directory")
        return

    myDir = source['CSV']['dir']
    myTables = source['CSV']['table']

    if not (myTables):
        Ts = read_csv_directory(myDir)
        if Ts:
            for i in range(len(Ts)):
                tName = ""
                tab_ref = "csv::" + myDir + "::" + Ts[i]
                if myDir.endswith('/'):
                    tName = myDir + Ts[i]
                else:
                    tName = myDir + '/' + Ts[i]
                callFahes(tab_ref, tName, output_dir, debug)
        else:
            tables = myTables.split(';')
            for i in tables:
                tName = ""
                tab_ref = "csv::" + myDir + "::" + i
                if myDir.endswith('/'):
                    tName = myDir + i
                else:
                    tName = myDir + '/' + i
                callFahes(tab_ref, tName, output_dir, debug)



def execute_fahes_files(input_sources, output_location, debug = 0):
    out_dir = ""
    try:
        with open(output_location) as output_loc:
            try:
                # print(os.path.abspath(f_name))    
                out_path = json.load(output_loc)
                for EL in out_path:
                    if EL.lower() == 'csv':
                        out_dir = out_path[EL]['dir']
            except Exception as e:
                if hasattr(e, 'message'):
                    print("Cannot read json file .. (", e.message, ")")
                else:
                    print("Cannot read json file .. (", e, ")")
                return None
    except:
        print("File not found .. (", output_location, ")")
        return None

    output_dir = ""
    # print("Out directory (", out_dir, ")")
    if out_dir:
        output_dir = os.path.abspath(out_dir)
        if not output_dir:
            print("Cannot locate absolute location of output directory")
    else:
        print("Cannot locate output directory")
        return 
    
    if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    sources = input_sources
    files = sources.split(';')
    sources_list = []
    if sources_list:
        for i in range(len(sources_list)):
            sources_list.remove(sources_list[0])
    for f_name in files:
        if f_name:
            # print(f_name)
            try:
                with open(f_name) as data_file:
                    try:
                        # print(os.path.abspath(f_name))    
                        data = json.load(data_file)
                        sources_list.append(data)
                    except:
                        print("Cannot read json file .. (", f_name, ")")
                        return None
            except:
                print("File not found .. (", f_name, ")")
                continue
    tName = ""


    for element in sources_list:
        if element:
            for T in element:
                if T.lower() == 'csv':
                    if not (element[T]['table']):
                        Ts = read_csv_directory(element[T]['dir'])
                        if Ts:
                            for i in range(len(Ts)):
                                tName = ""
                                tab_ref = "csv::"+element[T]['dir']+"::"+Ts[i]
                                if element[T]['dir'].endswith('/'):
                                    tName = element[T]['dir']+Ts[i]
                                else:
                                    tName = element[T]['dir']+'/'+Ts[i]
                                callFahes(tab_ref, tName, output_dir, debug)
                    else:
                        tables = element[T]['table'].split(';')
                        for i in tables:
                            tName = ""
                            tab_ref = "csv::"+element[T]['dir']+"::"+i
                            if element[T]['dir'].endswith('/'):
                                tName = element[T]['dir']+i
                            else:
                                tName = element[T]['dir']+'/'+i
                            callFahes(tab_ref, tName, output_dir, debug)
                    
                else:
                    print ("Unsupported data type .. (", T, ")")
        
        

def callFahes_w_tab_name(tab_full_name, output_dir):
    global tool_loc
    g_path = os.path.abspath(tool_loc)
    path = ""
    path = os.path.join(g_path, "libFahes.so")
    df = read_table(tab_full_name)
    dmvs_json = dict()
    dmvs_json.clear()
    dmvs_json['Cell_errors'] = []

    if len(df) > 0: 
        # print (df.columns)
        # print('======================')

        f_tab_name = c_char_p(tab_full_name.encode('utf-8'))
        out_dir = c_char_p(output_dir.encode('utf-8'))
        Fahes=ctypes.cdll.LoadLibrary(path)
        results = Fahes.execute(f_tab_name, out_dir)
        if results == 10:
            ext_start = tab_full_name.rfind('.')
            tab_name_start = tab_full_name.rfind('/')
            tab_name = tab_full_name[tab_name_start+1:ext_start]
            result_f_name = os.path.join(output_dir, 'DMV_' + tab_name + '.csv')
            DMVs = read_table(result_f_name)
            if len(DMVs) > 0:
                for idx in DMVs.index:
                    dmv = DMVs.iloc[idx]
                    att_idx = df.columns.tolist().index(dmv[0])
                    att = df[dmv[0]]
                    for i in att.index:
                        if att[i] == dmv[1]:
                            dmvs_json['Cell_errors'].append((att_idx, i))
                # print('======================')
                with open('DMV_' + tab_name + '.json', 'w') as fp:
                    json.dump(dmvs_json, fp)
                # for dmv in DMVs:
                #     print(DMVs[dmv])
    else:
        print ("An error occurred when reading the table .. ")
    
    return dmvs_json




def callFahes_w_df(df, output_dir):
    temp_data_folder = "temp"
    if not os.path.exists(temp_data_folder):
        os.makedirs(temp_data_folder)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    result_folder = os.path.abspath(output_dir)
    data_fname = os.path.join(temp_data_folder, "temp_data.csv")
    df.to_csv (data_fname, index = None, header=True, sep=',', quoting=csv.QUOTE_ALL, 
                    doublequote=True, encoding="ISO-8859-1")
    return callFahes_w_tab_name(data_fname, result_folder)



'''
import os
if not os.path.exists(directory):
    os.makedirs(directory)


- create a folder "metadata"
For file in input:
    DMV (vedi script)
'''




if __name__ == "__main__":
    # print ("Number of arguments = ", len(sys.argv))
    # for el in sys.argv:
    #     print (el)
    if len(sys.argv) < 3:
        print ("Argument should include <source folder, output folder, tables (optional)>");
    else:
        inputF = sys.argv[1]
        outputF = sys.argv[2]
        tab_name = os.path.abspath(inputF)
        results_location = os.path.abspath(outputF)
        print (inputF, results_location)
        if not tab_name:
            print("Cannot locate the input file ... ")
        else:
            if not results_location:
                os.makedirs(outputF)
                results_location = os.path.abspath(outputF)
            if not os.path.exists(results_location):
                os.makedirs(results_location)    
            print ("Executing Fahes ... the results will be stored in ", results_location)
            df = read_table(tab_name)
            callFahes_w_df(df, results_location)
            # callFahes_w_tab_name(tab_name, results_location)

