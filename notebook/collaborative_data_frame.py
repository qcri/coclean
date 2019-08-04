import pandas as pd
import qgrid.grid

from pymongo import MongoClient
from io import StringIO
from bson.objectid import ObjectId
from bson.timestamp import Timestamp
import json

from validator_collection import checkers
from urllib.parse import urlparse

import math
import collections
import threading
import time

from functools import reduce

from ipywidgets.widgets import Button, VBox, HBox


class CollaborativeDataFrame(pd.DataFrame):
    def __init__(self, data, *args, **kwargs):
        url = None
        hostname = kwargs.get('hostname', '127.0.0.1')
        metadata = kwargs.get('metadata', None)
        db_client = None

        if isinstance(data, pd.DataFrame):
            original_df = data
            if metadata:
                rows = set([row for tool,output in metadata.items() for row,col in output.get('Cell_errors', []) ])
                shared_df = data.iloc[list(rows)]
            else:
                shared_df = data

            db_client = MongoClient(f'mongodb://{hostname}:27017/db')

        elif isinstance(data, str) and checkers.is_url(data, allow_special_ips=True):
            # TODO fetch the data from url. temprarily we are using mongodb
            # TODO raise error if hostname from kwargs doesn't match the hostname in the url 
            # TODO validate the id, handle the case if the id is invalid or no data found 

            parsed = urlparse(data)
            hostname = parsed.hostname
            
            url = data
            id = url[-24:]
            db_client = MongoClient(f'mongodb://{hostname}:27017/db')
            document = db_client.db.datasets.find_one({'_id':ObjectId(id)})
            data, metadata = [document[key] for key in ['data', 'metadata']]
            shared_df = pd.read_csv(StringIO(data), index_col=0)
            original_df = shared_df.copy()
            
        else:
            raise ValueError('data must be either a DataFrame instance to be shared, or a string id of a previously shared DataFrame.')

        pd.DataFrame.__init__(self, shared_df.copy())
        self.hostname = hostname
        self.metadata = metadata
        self.db_client = db_client
        self.url = url
        self.user_id = kwargs.get('user_id', '')
        self.shared_df = shared_df
        self.original_df = original_df
        self.collaborators = collections.defaultdict(lambda: collections.defaultdict (lambda: pd.DataFrame().reindex_like(shared_df)))
        self.label = pd.DataFrame().reindex_like(shared_df)

        self.setup_widget()

        if self.url:
            self.monitor_changes()

    def monitor_changes(self):
        id = self.url[-24:]
        def get_dataset_timestamp():
            # logic from https://github.com/nswbmw/objectid-to-timestamp
            seconds = int(id[0:8], 16)
            increament = math.floor(int(id[-6:], 16) / 16777.217)
            return Timestamp(seconds, increament)

        highligted_cells = collections.defaultdict(dict)
        styles = """
        .tool_highlight {background-color: yellow}
        .highlight {background-color: red}; 
        """
        for tool,output in self.metadata.items():
            for row,col in output.get('Cell_errors', []):
                highligted_cells[self.index.get_loc(row)][self.columns[col]] = 'tool_highlight'
        def handle_changes():
            with self.db_client.db[id].watch(start_at_operation_time=get_dataset_timestamp(), full_document="updateLookup") as stream:
                for change in stream:
                    document = change['fullDocument']
                    user_id, index, column, type, new_value = [document[key] for key in ['user_id', 'index', 'column', 'type', 'new_value']]
                    self.collaborators[user_id][type].loc[index, column] = new_value
                    if user_id != self.user_id:
                        highligted_cells[index][column] = 'highlight'
                    self.grid_widget.set_cell_css_styles(styles, highligted_cells)

        def handle_uploads():
            last_upload = collections.defaultdict(lambda: pd.DataFrame().reindex_like(self.shared_df))
            get_dfs = lambda action: (self, self.shared_df) if action=='update' else (self.label, pd.DataFrame().reindex_like(self.shared_df))
            while True:
                for action in ['update', 'label']: 
                    current, original = get_dfs(action)
                    new_updates = current.mask((current == original) | (current == last_upload[action]))
                    for (index, column), new_value in new_updates.stack().iteritems():
                        self.db_client.db[id].update( 
                            {'index':index, 'column':column, 'user_id': self.user_id, 'type': action},
                            {'index':index, 'column':column, 'user_id': self.user_id, 'type': action, 'new_value':new_value}, upsert=True )
                        last_upload[action].loc[index,column] = new_value
                
                time.sleep(1)

        threading.Thread(target=handle_changes).start()
        threading.Thread(target=handle_uploads).start()

    def commit(self, *args, **kwargs):
        print('will commit here') 

    def refresh(self, *args, **kwargs):
        self.grid_widget.df = self

    def list_my_updates(self):
        return self.mask(self == self.shared_df).stack()

    def resolve(self, policy):
        resolved_label = pd.DataFrame().reindex_like(self.shared_df)
        resolved_update = pd.DataFrame().reindex_like(self.shared_df)
        metadata = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(dict)))
        for action, resolved in zip (['label', 'update'], [resolved_label, resolved_update]):
            counts = reduce(lambda df1, df2: df1 + df2, [dfs[action].notnull().astype('int') for dfs in self.collaborators.values()])
            to_resolve = counts.mask(counts<policy['at_least']).stack()
            for (row,col), ـ in to_resolve.iteritems():
                values = [dfs[action].loc[row,col] for dfs in self.collaborators.values()]
                if policy['option'] == 'majority_vote':
                    # TODO Handle Ties, Return to user to manually resolve.
                    val = max(set(values), key=values.count)
                    resolved.loc[row, col] = val
                    metadata[action][row][col] = val 
        
        df = self.original_df.copy()
        for (row,col), val in resolved_update.stack().iteritems():
            df.loc[row, col] = val

        return df, metadata

    def setup_widget(self):
        ### grid widget construction:
        def items_callback (index, column):
            items = {}
            for tool,output in self.metadata.items():
                for row,col in output.get('Cell_errors', []):
                    if row == index and self.columns[col] ==  column:
                        items [f"info_{tool}"] = f"False : Detected By {tool}" 

            items ["label_False"] = 'Label as False'
            for action, text in zip(['label', 'update'], ['Labeld By', 'Updated By']):
                for name, data in self.collaborators.items():
                    df = data[action]
                    val = df.loc[index,column]

                    if name == self.user_id or pd.isna(val):
                        continue

                    key = f"{action}_{val}_{name}" 
                    items[key]= f"{val} : {text} {name}" 

            return items

        def click_callback(index, column, key):
            action, val = key.split('_')[0:2]
            
            if action == 'update':
                self.grid_widget.edit_cell(index,column, val)
            elif action == 'label':
                self.label.loc[index,column] = val
            

        context_menu = {
                    'items_callback' : items_callback,
                    'click_callback' : click_callback
                }
        grid_widget = qgrid.show_grid(self, context_menu = context_menu)
        def handle_cell_edited(event, grid_widget):
            index, column, new_value = event['index'], event['column'], event['new']
            self.loc[index, column] = new_value 

        grid_widget.on('cell_edited', handle_cell_edited)
        self.grid_widget = grid_widget
        

        #refresh button
        refresh_button = Button(description='Refresh')
        refresh_button.on_click(self.refresh)

        #commit button
        commit_button = Button(description='Commit')
        commit_button.on_click(self.commit)

        def get_widget():
            self.refresh()
            return VBox([
                        HBox([refresh_button,commit_button]),
                        grid_widget
                ])
        self.get_widget = get_widget


    def share(self):
        if not self.url:
            id = self.db_client.db.datasets.insert({'data': self.to_csv(), 'metadata': self.metadata})
            self.url = f"http://{self.hostname}/dataset/{id}"
            self.monitor_changes()
        else:
            print('already shared!')

        return self.url
        



## sest up dispaly for ipython notebooks
try:
    from IPython.core.getipython import get_ipython
    from IPython.display import display
except ImportError:
    raise ImportError('This feature requires IPython 1.0+')

get_ipython().display_formatter.ipython_display_formatter.for_type(CollaborativeDataFrame, lambda cdf: display(cdf.get_widget()))
